import { getPassageMediaByPassageId } from '@/app/apis/passageMediaApi';
import type { PassageMediaResponse } from '@/app/types';
import type { ExamFlowStep } from '@/app/features/exam-layout/examLayoutTypes';

// Passage / media có thể đến ở dạng camelCase hoặc snake_case tuỳ API, nên chỉ mô tả các trường cần đọc.
type LooseMedia = {
  mediaType?: string | null;
  media_type?: string | null;
  mediaUrl?: string | null;
  media_url?: string | null;
};

type LoosePassage = {
  passageId?: string | null;
  passage_id?: string | null;
  passageType?: string | null;
  passage_type?: string | null;
  mediaUrl?: string | null;
  media_url?: string | null;
  passageMedias?: unknown;
  passageMediaList?: unknown;
  passage_media?: unknown;
};

type PassageHolder = {
  passage?: LoosePassage | null;
  passageId?: string | null;
};

type LooseGroup = PassageHolder & { questions?: PassageHolder[] };

type LoosePart = { questionGroups?: LooseGroup[] };

export const hasMediaList = (p: LoosePassage | null | undefined) => {
  const list = p?.passageMedias ?? p?.passageMediaList ?? p?.passage_media;
  return Array.isArray(list) && list.length > 0;
};

export const passageHasAudio = (passage: LoosePassage | null | undefined) => {
  const list =
    passage?.passageMedias ?? passage?.passageMediaList ?? passage?.passage_media ?? [];
  if (Array.isArray(list)) {
    const found = list.some(
      (m: LooseMedia | null | undefined) =>
        (m?.mediaType ?? m?.media_type ?? '').toUpperCase() === 'AUDIO' &&
        (m?.mediaUrl ?? m?.media_url),
    );
    if (found) return true;
  }
  const single = passage?.mediaUrl ?? passage?.media_url;
  const pType = (passage?.passageType ?? passage?.passage_type ?? '').toUpperCase();
  return Boolean(single) && pType === 'LISTENING';
};

export const isListeningStep = (step?: ExamFlowStep | null) =>
  !!step && (step.audioGated === true || step.sectionType === 'LISTENING');

export async function enrichTestWithPassageMedia<T extends { parts?: LoosePart[] }>(
  testData: T,
): Promise<T> {
  const parts = testData.parts || [];
  const passageIdsToFetch = new Set<string>();
  parts.forEach((part) => {
    (part.questionGroups || []).forEach((group) => {
      const gpid = group.passage?.passageId ?? group.passage?.passage_id;
      if (gpid && !hasMediaList(group.passage)) passageIdsToFetch.add(gpid);
      (group.questions || []).forEach((q) => {
        const qpid = q.passage?.passageId ?? q.passage?.passage_id ?? q.passageId;
        if (qpid && !hasMediaList(q.passage)) passageIdsToFetch.add(qpid);
      });
    });
  });
  if (passageIdsToFetch.size === 0) return testData;

  const ids = [...passageIdsToFetch];
  const results = await Promise.all(
    ids.map((id) => getPassageMediaByPassageId(id).catch((): PassageMediaResponse[] => [])),
  );
  const mediaMap: Record<string, PassageMediaResponse[]> = Object.fromEntries(
    ids.map((id, i) => [id, results[i]]),
  );

  const enrichWrapper = <W extends PassageHolder>(obj: W): W => {
    const pid = obj?.passage?.passageId ?? obj?.passage?.passage_id ?? obj?.passageId;
    if (pid && mediaMap[pid]) {
      return {
        ...obj,
        passage: {
          ...(obj.passage || { passageId: pid }),
          passageMedias: mediaMap[pid],
        },
      };
    }
    return obj;
  };

  const enrichedParts = parts.map((part) => ({
    ...part,
    questionGroups: (part.questionGroups || []).map((group) => ({
      ...enrichWrapper(group),
      questions: (group.questions || []).map(enrichWrapper),
    })),
  }));
  return { ...testData, parts: enrichedParts } as T;
}
