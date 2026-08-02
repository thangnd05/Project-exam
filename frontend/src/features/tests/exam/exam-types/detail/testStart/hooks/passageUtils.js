import { getPassageMediaByPassageId } from '~/shared/api/passageMediaApi';

export const hasMediaList = (p) => {
  const list = p?.passageMedias ?? p?.passageMediaList ?? p?.passage_media;
  return Array.isArray(list) && list.length > 0;
};

export const passageHasAudio = (passage) => {
  const list =
    passage?.passageMedias ?? passage?.passageMediaList ?? passage?.passage_media ?? [];
  if (Array.isArray(list)) {
    const found = list.some(
      (m) =>
        (m?.mediaType ?? m?.media_type ?? '').toUpperCase() === 'AUDIO' &&
        (m?.mediaUrl ?? m?.media_url),
    );
    if (found) return true;
  }
  const single = passage?.mediaUrl ?? passage?.media_url;
  const pType = (passage?.passageType ?? passage?.passage_type ?? '').toUpperCase();
  return Boolean(single) && pType === 'LISTENING';
};

export const isListeningStep = (step) =>
  !!step && (step.audioGated === true || step.sectionType === 'LISTENING');

export async function enrichTestWithPassageMedia(testData) {
  const parts = testData.parts || [];
  const passageIdsToFetch = new Set();
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
    ids.map((id) => getPassageMediaByPassageId(id).catch(() => [])),
  );
  const mediaMap = Object.fromEntries(ids.map((id, i) => [id, results[i]]));

  const enrichWrapper = (obj) => {
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
  return { ...testData, parts: enrichedParts };
}
