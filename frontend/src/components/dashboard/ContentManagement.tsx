import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Edit, Upload, Save, X } from 'lucide-react';

interface ContentItem {
    id: string;
    key: string;
    value: string;
    type: 'IMAGE' | 'TEXT';
    description: string;
    updatedAt: string;
}

const ContentManagement = () => {
    const { showToast } = useToast();
    const [content, setContent] = useState<Record<string, ContentItem>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);

    const fetchContent = async () => {
        try {
            const res = await api.get('/content');
            setContent(res.data.data.content);
        } catch (error) {
            console.error("Failed to fetch content", error);
            showToast("Failed to fetch content", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleEditClick = (key: string, currentValue: string) => {
        setEditingKey(key);
        setEditValue(currentValue);
    };

    const handleSaveText = async (key: string) => {
        try {
            await api.patch(`/content/${key}`, { value: editValue });
            setEditingKey(null);
            fetchContent(); // Refresh
            showToast("Content updated successfully!", "success");
        } catch (error) {
            console.error("Failed to update content", error);
            showToast("Failed to update content", "error");
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploadingKey(key);
        try {
            // 1. Upload Image
            const uploadRes = await api.post('/upload?folder=content', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = uploadRes.data.data.url;

            // 2. Update Content with new URL
            await api.patch(`/content/${key}`, { value: imageUrl });

            fetchContent(); // Refresh
            showToast("Image uploaded and content updated successfully!", "success");
        } catch (err) {
            console.error("Upload failed", err);
            showToast("Failed to upload image", "error");
        } finally {
            setUploadingKey(null);
        }
    };

    if (isLoading) return <div>Loading content...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Site Content Management</h2>
                <button
                    onClick={() => api.post('/content/init').then(fetchContent)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Reset Defaults
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Object.values(content).map((item) => (
                            <tr key={item.key} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {item.description}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                    {item.key}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {item.type === 'IMAGE' ? (
                                        <div className="relative group w-32 h-20 bg-gray-100 rounded overflow-hidden">
                                            <img
                                                src={item.value}
                                                alt={item.description}
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image')}
                                            />
                                        </div>
                                    ) : (
                                        editingKey === item.key ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full border rounded px-2 py-1"
                                            />
                                        ) : (
                                            <span className="line-clamp-2">{item.value}</span>
                                        )
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        {item.type === 'IMAGE' ? (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id={`upload-${item.key}`}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, item.key)}
                                                    disabled={uploadingKey === item.key}
                                                />
                                                <label
                                                    htmlFor={`upload-${item.key}`}
                                                    className={`cursor-pointer p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 ${uploadingKey === item.key ? 'opacity-50' : ''}`}
                                                >
                                                    <Upload size={16} />
                                                    {uploadingKey === item.key ? 'Uploading...' : 'Change'}
                                                </label>
                                            </div>
                                        ) : (
                                            editingKey === item.key ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveText(item.key)}
                                                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingKey(null)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditClick(item.key, item.value)}
                                                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContentManagement;
