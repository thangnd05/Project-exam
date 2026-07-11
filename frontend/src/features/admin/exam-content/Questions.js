import { useState } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import {
    Plus,
    Edit,
    Trash2,
    FileQuestion,
    Eye,
    Copy
} from 'lucide-react';

import {
    fakeQuestions,
    getUserById,
    dashboardStats
} from '../data/fakeData';
import {
    AdminPageHeader,
    AdminTable,
    AdminToolbar,
    StatCard,
    StatCardGroup,
} from '../components/common';

const questionTypeLabels = {
    'MCQ': 'Trắc nghiệm',
    'FILL_BLANK': 'Điền trống',
    'ESSAY': 'Tự luận'
};

const questionTypeColors = {
    'MCQ': 'primary',
    'FILL_BLANK': 'warning',
    'ESSAY': 'info'
};

const QuestionsManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const questionsWithData = fakeQuestions.map(q => ({
        ...q,
        creator: getUserById(q.created_by)
    }));

    const filteredQuestions = questionsWithData.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleView = () => {};
    const handleEdit = () => {};
    const handleDelete = () => {};

    const columns = [
        {
            key: 'question_text',
            header: 'Câu hỏi',
            render: (q) => q.question_text,
        },
        {
            key: 'question_type',
            header: 'Loại',
            render: (q) => (
                <Badge bg={questionTypeColors[q.question_type]}>
                    {questionTypeLabels[q.question_type]}
                </Badge>
            ),
        },
        {
            key: 'creator',
            header: 'Người tạo',
            render: (q) => q.creator?.full_name,
        },
        {
            key: 'is_bank',
            header: 'Ngân hàng',
            render: (q) => (
                <Badge bg={q.is_bank ? 'success' : 'secondary'}>
                    {q.is_bank ? 'Ngân hàng' : 'Lớp học'}
                </Badge>
            ),
        },
    ];

    return (
        <div className="d-flex flex-column gap-3">
            <AdminPageHeader
                title="Quản lý Câu hỏi"
                description="Quản lý ngân hàng câu hỏi trong hệ thống"
            >
                <Button variant="primary">
                    <Plus size={18} className="me-1" />
                    Thêm câu hỏi
                </Button>
            </AdminPageHeader>

            <StatCardGroup>
                <StatCard
                    label="Tổng câu hỏi"
                    value={dashboardStats.totalQuestions}
                    icon={FileQuestion}
                    tone="blue"
                />
                <StatCard
                    label="Trắc nghiệm"
                    value={fakeQuestions.filter(q => q.question_type === 'MCQ').length}
                    icon={FileQuestion}
                    tone="green"
                />
                <StatCard
                    label="Điền trống"
                    value={fakeQuestions.filter(q => q.question_type === 'FILL_BLANK').length}
                    icon={FileQuestion}
                    tone="amber"
                />
            </StatCardGroup>

            <AdminToolbar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Tìm kiếm câu hỏi..."
            >
                <Form.Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">Tất cả loại</option>
                    <option value="MCQ">Trắc nghiệm</option>
                    <option value="FILL_BLANK">Điền trống</option>
                    <option value="ESSAY">Tự luận</option>
                </Form.Select>
            </AdminToolbar>

            <AdminTable
                showIndex
                paginated
                itemLabel="câu hỏi"
                columns={columns}
                data={filteredQuestions}
                getRowKey={(q) => q.question_id}
                rowActions={(q) => (
                    <>
                        <button title="Xem" onClick={() => handleView(q)}>
                            <Eye size={16} />
                        </button>
                        <button title="Sao chép">
                            <Copy size={16} />
                        </button>
                        <button title="Sửa" onClick={() => handleEdit(q)}>
                            <Edit size={16} />
                        </button>
                        <button className="danger" title="Xóa" onClick={() => handleDelete(q)}>
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            />
        </div>
    );
};

export default QuestionsManagement;
