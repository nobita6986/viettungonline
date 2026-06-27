'use client';

import { useState } from 'react';
import { processDataMigration } from '@/lib/apiActions';
import { toast } from 'react-hot-toast';

export default function ImportDataUI() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async (dryRun: boolean) => {
    if (!file) {
      toast.error('Vui lòng chọn file CSV');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await processDataMigration(formData, dryRun);
      
      if (!res.success) {
        toast.error(res.error || 'Có lỗi xảy ra');
        setResult(res);
      } else {
        toast.success(dryRun ? 'Phân tích dữ liệu thành công' : 'Import dữ liệu thành công!');
        setResult(res);
      }
    } catch (error: any) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nhập Dữ Liệu Cũ (Data Migration)
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Tải lên file Excel (.xlsx, .xls) chứa dữ liệu giao dịch cũ. Hệ thống sẽ tự động đọc chuẩn Unicode, phân loại, kiểm tra trùng lặp (Idempotency) và lưu vào cơ sở dữ liệu.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Chưa có file mẫu?</h3>
              <p className="text-xs text-muted-foreground">Tải file mẫu về, điền dữ liệu bằng Excel và upload trực tiếp lên đây (Không cần lưu thành CSV).</p>
            </div>
            <a 
              href="/templates/Mau_Import_DuLieu.xlsx" 
              download
              className="mt-2 sm:mt-0 flex items-center px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải Excel Mẫu
            </a>
          </div>

          <div className="grid w-full max-w-sm items-center gap-2">
            <label htmlFor="file-upload" className="font-semibold text-sm text-gray-700">Chọn file dữ liệu (Excel):</label>
            <input 
              id="file-upload" 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
            <button 
              onClick={() => handleImport(true)} 
              disabled={!file || isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              Chạy Thử Nghiệm (Dry-Run)
            </button>
            <button 
              onClick={() => handleImport(false)} 
              disabled={!file || isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              Tiến Hành Import (Thực thi)
            </button>
          </div>

          {result && (
            <div className="mt-8 space-y-4">
              {result.success ? (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 flex gap-3 items-start">
                  <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-green-800 font-bold">
                      {result.dryRun ? 'Kết quả Phân Tích (Dry-Run)' : 'Kết quả Import'}
                    </h4>
                    <div className="text-green-700 mt-1">
                      <p>{result.message}</p>
                      {!result.dryRun && (
                        <ul className="list-disc ml-5 mt-2 space-y-1 text-sm font-medium">
                          <li>Thành công (Thêm mới): {result.successCount}</li>
                          <li className="text-amber-600">Bỏ qua (Trùng lặp): {result.skipCount}</li>
                          {result.errorCount > 0 && <li className="text-red-600">Lỗi: {result.errorCount}</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex gap-3 items-start">
                  <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-bold">Lỗi Import</h4>
                    <div className="text-red-700 mt-1">{result.error}</div>
                  </div>
                </div>
              )}

              {result.dryRun && result.previewData && result.previewData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-6">
                  <div className="bg-gray-50 border-b px-4 py-3 font-semibold text-gray-700">
                    Bản Xem Trước Dữ Liệu (Tối đa 50 dòng)
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 bg-gray-50 uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-2">Trạng Thái</th>
                          <th className="px-4 py-2">Ngày</th>
                          <th className="px-4 py-2">Loại</th>
                          <th className="px-4 py-2">Số tiền</th>
                          <th className="px-4 py-2">Mô tả</th>
                          <th className="px-4 py-2">Nhóm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.previewData.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-2">
                              {row.isExisting 
                                ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Trùng lặp</span>
                                : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Thêm mới</span>
                              }
                            </td>
                            <td className="px-4 py-2">{new Date(row.date).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-2 font-bold text-gray-700">
                              {row.type === 'INCOME' ? 'THU' : 'CHI'}
                            </td>
                            <td className={`px-4 py-2 font-semibold ${row.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.amount)}
                            </td>
                            <td className="px-4 py-2 truncate max-w-xs" title={row.description}>
                              {row.description.replace(/\[ID:.*?\] /, '')}
                            </td>
                            <td className="px-4 py-2 text-gray-500">{row.cashFlowGroup}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md border border-red-200 dark:border-red-900 text-sm h-48 overflow-y-auto">
                  <h4 className="font-bold text-red-800 dark:text-red-400 mb-2">Chi tiết các dòng bị lỗi:</h4>
                  <ul className="list-decimal ml-5 space-y-1 text-red-700 dark:text-red-300">
                    {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
