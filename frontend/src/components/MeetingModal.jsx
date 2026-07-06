import { useState } from 'react';
import { api } from '../api';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MeetingModal({ meeting, currentUser, onClose, onDeleted, onEdit }) {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isOwner = meeting.organizer_id === currentUser.id;

  async function handleDelete() {
    if (!confirm(`Xóa cuộc họp "${meeting.title}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteMeeting(meeting.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 pr-4">{meeting.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <dl className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <dt className="text-gray-500">Phòng</dt>
            <dd className="text-gray-900 font-medium">{meeting.room_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Thời gian</dt>
            <dd className="text-gray-900 font-medium text-right">
              {formatTime(meeting.start_time)} — {formatTime(meeting.end_time)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Người tổ chức</dt>
            <dd className="text-gray-900 font-medium">{meeting.organizer_name}</dd>
          </div>
          {meeting.attendees?.length > 0 && (
            <div>
              <dt className="text-gray-500 mb-1">Người tham dự</dt>
              <dd className="flex flex-wrap gap-1.5">
                {meeting.attendees.map((a) => (
                  <span key={a} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {a}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {meeting.equipment?.length > 0 && (
            <div>
              <dt className="text-gray-500 mb-1">Thiết bị</dt>
              <dd className="flex flex-wrap gap-1.5">
                {meeting.equipment.map((eq) => (
                  <span key={eq} className="bg-primary-light text-primary text-xs px-2 py-1 rounded-full">
                    {eq}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {meeting.description && (
            <div>
              <dt className="text-gray-500 mb-1">Mô tả</dt>
              <dd className="text-gray-700">{meeting.description}</dd>
            </div>
          )}
        </dl>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {isOwner ? (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(meeting)}
              className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg py-2 transition"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg py-2 transition disabled:opacity-60"
            >
              {deleting ? 'Đang xóa...' : 'Xóa lịch họp'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center">
            Chỉ người tổ chức ({meeting.organizer_name}) mới có thể sửa hoặc xóa cuộc họp này.
          </p>
        )}
      </div>
    </div>
  );
}
