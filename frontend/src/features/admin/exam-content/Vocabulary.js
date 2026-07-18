import { useState } from 'react';
import { Badge, Button, Form } from 'react-bootstrap';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    Volume2,
    Copy
} from 'lucide-react';

import {
    fakeVocabulary,
    fakeVocabularyAlbums,
    dashboardStats
} from '../data/fakeData';
import {
    AdminPageHeader,
    AdminToolbar,
    AdminTable,
    StatCard,
    StatCardGroup,
} from '../components/common';

const VocabularyManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [albumFilter, setAlbumFilter] = useState('all');
    const [currentPage] = useState(1);
    const itemsPerPage = 10;

    const vocabWithData = fakeVocabulary.map(v => {
        const album = fakeVocabularyAlbums.find(a => a.album_id === v.album_id);
        return { ...v, album };
    });

    const filteredVocab = vocabWithData.filter(v => {
        const matchesSearch = v.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.meaning.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAlbum = albumFilter === 'all' || v.album_id === parseInt(albumFilter);
        return matchesSearch && matchesAlbum;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVocab = filteredVocab.slice(indexOfFirstItem, indexOfLastItem);

    const handleView = () => {};
    const handleEdit = () => {};
    const handleDelete = () => {};

    const totalLearned = fakeVocabularyAlbums.reduce((acc, album) => {
        return acc + fakeVocabulary.filter(v => v.album_id === album.album_id).length;
    }, 0);

    const columns = [
        {
            key: 'word',
            header: 'Từ vựng',
            render: (v) => (
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold">{v.word}</span>
                    {v.voice_url && (
                        <button title="Phát âm">
                            <Volume2 size={14} />
                        </button>
                    )}
                </div>
            ),
        },
        { key: 'phonetic', header: 'Phiên âm', render: (v) => v.phonetic },
        { key: 'meaning', header: 'Nghĩa', render: (v) => v.meaning },
        {
            key: 'album',
            header: 'Album',
            render: (v) => <Badge bg="primary">{v.album?.name}</Badge>,
        },
    ];

    return (
        <div className="d-flex flex-column gap-3">
            <AdminPageHeader
                title="Quản lý Từ vựng"
                description="Quản lý từ vựng và album trong hệ thống"
            >
                <Button variant="primary">
                    <Plus size={18} className="me-1" />
                    Thêm từ vựng
                </Button>
            </AdminPageHeader>

            <StatCardGroup>
                <StatCard label="Tổng từ vựng" value={dashboardStats.totalVocabulary} />
                <StatCard label="Thẻ Ghi Nhớ" value={fakeVocabularyAlbums.length} />
                <StatCard label="Từ đã học" value={totalLearned} />
            </StatCardGroup>

            <AdminToolbar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Tìm kiếm từ vựng..."
            >
                <Form.Select
                    value={albumFilter}
                    onChange={(e) => setAlbumFilter(e.target.value)}
                >
                    <option value="all">Tất cả album</option>
                    {fakeVocabularyAlbums.map(album => (
                        <option key={album.album_id} value={album.album_id}>
                            {album.name}
                        </option>
                    ))}
                </Form.Select>
            </AdminToolbar>

            <AdminTable
                showIndex
                paginated
                itemLabel="từ vựng"
                columns={columns}
                data={filteredVocab}
                loading={false}
                getRowKey={(v) => v.vocab_id}
                rowActions={(v) => (
                    <>
                        <button title="Xem" onClick={() => handleView(v)}>
                            <Eye size={16} />
                        </button>
                        <button title="Sao chép">
                            <Copy size={16} />
                        </button>
                        <button title="Sửa" onClick={() => handleEdit(v)}>
                            <Edit size={16} />
                        </button>
                        <button className="danger" title="Xóa" onClick={() => handleDelete(v)}>
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            />
        </div>
    );
};

export default VocabularyManagement;
