'use client';

import { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { getMigrationDependencies, importBulkTransactions, importBulkOrders, autoReconcileCashflow } from '@/lib/apiActions';
import { toast } from 'react-hot-toast';
import { parseAndMapOrderData } from '@/utils/order-mapper';

export function autoMapFinanceData(rawData: any[], dependencies: any) {
  const { accounts, categories, users } = dependencies;

  return rawData.map((row, index) => {
    // 1. Amount & Type
    let amountNum = 0;
    let type = 'EXPENSE';

    const rawThu = parseFloat(String(row['Thu'] || '0').replace(/,/g, ''));
    const rawChi = parseFloat(String(row['Chi'] || '0').replace(/,/g, ''));

    if (rawThu > 0) {
      type = 'INCOME';
      amountNum = rawThu;
    } else if (rawChi > 0) {
      type = 'EXPENSE';
      amountNum = rawChi;
    }

    // 2. Date
    let dateObj = new Date();
    if (row['Ngày']) {
      if (typeof row['Ngày'] === 'number') {
        dateObj = new Date((row['Ngày'] - (25567 + 2)) * 86400 * 1000);
      } else {
        dateObj = new Date(row['Ngày']);
      }
    }

    // 3. Auto Map CashFlowGroup
    const note = String(row['Ghi chú'] || '').trim();
    const upperNote = note.toUpperCase();
    let cashFlowGroup = 'OPERATIONAL';
    if (upperNote.includes('TIỀN HÀNG') || upperNote.includes('TRADING') || upperNote.includes('BÁN HÀNG') || upperNote.includes('NHẬP HÀNG')) {
      cashFlowGroup = 'TRADING';
    }

    // 4. Auto Map AccountId
    const method = String(row['Phương thức'] || '').trim().toUpperCase();
    let accountId = '';
    if (method.includes('TK CT') || method.includes('TÀI KHOẢN')) {
      const companyAcc = accounts.find((a: any) => a.name.toLowerCase().includes('tài khoản') || a.name.toLowerCase().includes('công ty'));
      if (companyAcc) accountId = companyAcc.id;
    } else if (method.includes('TK TM') || method.includes('TIỀN MẶT')) {
      const cashAcc = accounts.find((a: any) => a.name.toLowerCase().includes('tiền mặt'));
      if (cashAcc) accountId = cashAcc.id;
    }

    // 5. Category Name, Description & User
    const categoryName = String(row['Loại Tiền'] || '').trim();
    const executer = String(row['Người thực hiện'] || '').trim();
    const description = note;

    let userId = '';
    if (executer) {
      const userMatch = (users || []).find((u: any) =>
        u.name?.toLowerCase().includes(executer.toLowerCase()) ||
        executer.toLowerCase().includes(u.name?.toLowerCase() || '')
      );
      if (userMatch) userId = userMatch.id;
    }

    // 6. Legacy Key
    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : 'INVALID';
    const hashNote = note.replace(/\s+/g, '').slice(0, 10).toUpperCase();
    const legacyIdKey = `LGC_FIN_${dateStr}_${amountNum}_${hashNote}_${index}`;

    return {
      id: index, // Local ID for editing
      date: !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '',
      amount: amountNum,
      type,
      description,
      categoryName,
      cashFlowGroup,
      accountId,
      userId,
      legacyIdKey
    };
  });
}

export default function DataImportGUI() {
  const [importType, setImportType] = useState<'FINANCE' | 'ORDER' | 'RECONCILE'>('FINANCE');
  const [dependencies, setDependencies] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // States for Unified Wizard (RECONCILE Tab)
  const [financeFiles, setFinanceFiles] = useState<File[]>([]);
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [wizardStatus, setWizardStatus] = useState<string>('');
  const [wizardProgress, setWizardProgress] = useState<number>(0);

  const [reconcileResult, setReconcileResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch accounts and categories on load
    getMigrationDependencies().then(deps => {
      setDependencies(deps);
    }).catch(() => {
      toast.error('Lỗi tải danh mục phụ trợ');
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const processFile = () => {
    if (!selectedFile) return;

    if (!dependencies) {
      toast.error('Đang tải danh mục, vui lòng chờ...');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Đang phân tích dữ liệu...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = xlsx.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          toast.error('File Excel không có dữ liệu', { id: toastId });
          setIsLoading(false);
          return;
        }

        const mappedData = importType === 'FINANCE'
          ? autoMapFinanceData(jsonData, dependencies)
          : parseAndMapOrderData(jsonData, dependencies);

        setParsedData(mappedData);
        toast.success(`Đã phân tích xong ${mappedData.length} dòng`, { id: toastId });
      } catch (error) {
        console.error("Lỗi parse file:", error);
        toast.error('Có lỗi xảy ra khi đọc file Excel', { id: toastId });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleFieldChange = (id: number, field: string, value: any) => {
    setParsedData(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleRemoveRow = (id: number) => {
    setParsedData(prev => prev.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    if (importType === 'FINANCE') {
      // Validate missing fields for Finance
      const invalidRows = parsedData.filter(d => !d.accountId || !d.date || !d.amount || !d.description);
      if (invalidRows.length > 0) {
        toast.error(`Có ${invalidRows.length} dòng chưa điền đủ Tài khoản, Ngày, hoặc Số tiền/Ghi chú`);
        return;
      }
    } else {
      // Validate missing fields for Orders
      const invalidRows = parsedData.filter(d => !d.itemName || !d.orderDate);
      if (invalidRows.length > 0) {
        toast.error(`Có ${invalidRows.length} dòng Đơn hàng chưa có Tên hàng hoặc Ngày`);
        return;
      }
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Đang lưu dữ liệu vào hệ thống...');

    try {
      const result = importType === 'FINANCE'
        ? await importBulkTransactions(parsedData)
        : await importBulkOrders(parsedData);

      if (result.success) {
        toast.success(`Đã lưu thành công ${result.successCount} bản ghi!`, { id: loadingToast });
        setParsedData([]); // Clear after save
      } else {
        toast.error(result.error || 'Lỗi khi lưu dữ liệu', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error(e.message || 'Lỗi', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReconcile = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Đang chạy thuật toán đối soát tự động...');
    try {
      const res = await autoReconcileCashflow();
      if (res.success) {
        setReconcileResult(res);
        toast.success(`Đã tự động đối soát ${res.matchedCount} giao dịch!`, { id: toastId });
      } else {
        toast.error(res.error || 'Lỗi khi đối soát', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardSubmit = async () => {
    if (financeFiles.length === 0 && !orderFile) {
      toast.error('Vui lòng chọn ít nhất 1 file Tài chính hoặc Đơn hàng');
      return;
    }

    if (!dependencies) {
      toast.error('Đang tải danh mục, vui lòng chờ...');
      return;
    }

    setIsLoading(true);
    setWizardProgress(10);
    setWizardStatus('Đang đọc file Tài Chính...');

    try {
      // 1. Process Finance Files
      let allFinanceData: any[] = [];
      for (const f of financeFiles) {
        const buffer = await f.arrayBuffer();
        const wb = xlsx.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(ws, { header: 2, range: 1 });
        const mapped = autoMapFinanceData(jsonData, dependencies);
        allFinanceData = [...allFinanceData, ...mapped];
      }

      setWizardProgress(30);
      if (allFinanceData.length > 0) {
        setWizardStatus('Đang import dữ liệu Tài Chính vào DB...');
        const resFin = await importBulkTransactions(allFinanceData);
        if (!resFin.success) throw new Error(resFin.error);
      }

      // 2. Process Order File
      setWizardProgress(60);
      if (orderFile) {
        setWizardStatus('Đang đọc file Đơn Hàng...');
        const buffer = await orderFile.arrayBuffer();
        const wb = xlsx.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(ws);
        const mapped = parseAndMapOrderData(jsonData, dependencies);

        setWizardStatus('Đang import dữ liệu Đơn Hàng vào DB...');
        const resOrd = await importBulkOrders(mapped);
        if (!resOrd.success) throw new Error(resOrd.error);
      }

      // 3. Reconcile
      setWizardProgress(80);
      setWizardStatus('Đang chạy thuật toán Đối Soát Tự Động...');
      const resRec = await autoReconcileCashflow();
      if (resRec.success) {
        setReconcileResult(resRec);
      } else {
        toast.error('Đối soát gặp lỗi: ' + resRec.error);
      }

      setWizardProgress(100);
      setWizardStatus('Hoàn thành toàn bộ quy trình!');
      toast.success('Đã hoàn tất quy trình Import & Đối soát');

    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống');
      setWizardStatus('Gặp lỗi: ' + (err.message || 'Unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${importType === 'FINANCE' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => { setImportType('FINANCE'); setParsedData([]); setSelectedFile(null); setReconcileResult(null); }}
          >
            Nhập dữ liệu TÀI CHÍNH
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${importType === 'ORDER' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => { setImportType('ORDER'); setParsedData([]); setSelectedFile(null); setReconcileResult(null); }}
          >
            Nhập dữ liệu ĐƠN HÀNG
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${importType === 'RECONCILE' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => { setImportType('RECONCILE'); setParsedData([]); setSelectedFile(null); }}
          >
            ĐỐI SOÁT DÒNG TIỀN
          </button>
        </div>
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Nhập Dữ Liệu Cũ
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Công cụ Review trực quan. Bạn có thể chỉnh sửa lại dữ liệu bị map sai trước khi lưu thật vào hệ thống.
          </p>
        </div>

        {importType === 'RECONCILE' ? (
          <div className="p-6 space-y-8">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
              <h3 className="font-bold text-blue-900 mb-2"> 마법사 (Wizard) Import & Đối Soát Tự Động</h3>
              <p className="text-sm text-blue-800">
                Khu vực upload tất cả các file cùng lúc. Hệ thống sẽ tự động ghép nối, import và chạy thuật toán đối soát 3 bước để liên kết dòng tiền với Đơn Hàng tương ứng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box Upload Tài Chính */}
              <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-primary-100 text-primary-700 p-1.5 rounded-md text-xs">Bước 1</span>
                    Files Sổ Quỹ (Tài Chính)
                  </h4>
                  <label htmlFor="finance-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition" title="Thêm file">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ pointerEvents: 'none' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <input
                      id="finance-upload"
                      type="file"
                      multiple
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const filesToAdd = Array.from(e.target.files);
                          setFinanceFiles(prev => [...prev, ...filesToAdd]);
                        }
                        e.target.value = ''; // Reset input
                      }}
                    />
                  </label>
                </div>

                {financeFiles.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed rounded-lg">
                    Chưa có file nào.<br />Nhấn dấu + để tải lên sổ quỹ các tháng.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {financeFiles.map((f, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border">
                        <span className="truncate max-w-[200px] font-medium" title={f.name}>{f.name}</span>
                        <button onClick={() => setFinanceFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded">Xoá</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Box Upload Đơn Hàng */}
              <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-orange-100 text-orange-700 p-1.5 rounded-md text-xs">Bước 2</span>
                    File Đơn Hàng (Tổng hợp)
                  </h4>
                  <label htmlFor="order-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition" title="Chọn file">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ pointerEvents: 'none' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <input
                      id="order-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          setOrderFile(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {!orderFile ? (
                  <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed rounded-lg">
                    Chưa có file Đơn Hàng.
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-sm bg-orange-50 p-3 rounded border border-orange-100 text-orange-900">
                    <span className="font-semibold truncate">{orderFile.name}</span>
                    <button onClick={() => setOrderFile(null)} className="text-red-500 hover:bg-red-100 p-1 rounded">Xoá</button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6 flex flex-col items-center">
              <button
                onClick={handleWizardSubmit}
                disabled={isLoading || (financeFiles.length === 0 && !orderFile)}
                className="bg-primary-600 disabled:bg-gray-300 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all transform hover:scale-105 active:scale-95"
              >
                {isLoading ? 'Hệ thống đang chạy...' : '🚀 CHẠY TOÀN BỘ QUY TRÌNH (BƯỚC 3)'}
              </button>

              {wizardStatus && (
                <div className="mt-4 w-full max-w-md text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{wizardStatus}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${wizardProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {reconcileResult && (
              <div className="mt-6 border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white p-4 border-b flex justify-between items-center">
                  <div className="font-semibold text-gray-800">Kết quả đối soát</div>
                  <div className="text-sm px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full">
                    Đã nối thành công: {reconcileResult.matchedCount} giao dịch
                  </div>
                </div>
                {reconcileResult.unmatchedList?.length > 0 && (
                  <div className="p-4 bg-orange-50">
                    <h4 className="font-semibold text-orange-800 mb-2">⚠️ Các giao dịch KHÔNG THỂ MAP (Unmatched)</h4>
                    <p className="text-xs text-orange-700 mb-4">Bạn có thể cần map thủ công các khoản tiền này ở màn hình Quản lý Đơn hàng.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-orange-900 uppercase bg-orange-100/50">
                          <tr>
                            <th className="px-4 py-2">Loại</th>
                            <th className="px-4 py-2">Số tiền</th>
                            <th className="px-4 py-2">Ngày</th>
                            <th className="px-4 py-2">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconcileResult.unmatchedList.map((tx: any) => (
                            <tr key={tx.id} className="bg-white border-b border-orange-100">
                              <td className="px-4 py-2 font-medium">{tx.type}</td>
                              <td className="px-4 py-2 font-bold">{tx.amount?.toLocaleString()} đ</td>
                              <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{tx.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : parsedData.length === 0 ? (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Chưa có file mẫu?</h3>
                <p className="text-xs text-muted-foreground">Tải file mẫu về, điền dữ liệu bằng Excel và upload trực tiếp lên đây (Không cần lưu thành CSV).</p>
              </div>
              <a
                href={importType === 'FINANCE' ? "/templates/Mau_Import_DuLieu.xlsx" : "/Mau_Import_DonHang.xlsx"}
                download
                className="mt-2 sm:mt-0 flex items-center px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {importType === 'FINANCE' ? 'Tải Excel Mẫu' : 'Tải Mẫu Đơn Hàng'}
              </a>
            </div>

            <div className="grid w-full items-center gap-2">
              <label className="font-semibold text-sm text-gray-700">Chọn file dữ liệu (Excel):</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="flex h-10 w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={processFile}
                  disabled={!selectedFile || isLoading || !dependencies}
                  className="h-10 px-4 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Đang đọc...' : 'Đọc File Excel'}
                </button>
              </div>
              {!dependencies && (
                <p className="text-xs text-amber-600 mt-1">
                  Đang kết nối Database để tải danh mục. Nút đọc file sẽ mở khi kết nối xong.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-bold text-gray-800">
                Chế độ Review ({parsedData.length} dòng)
              </h3>
              <div className="space-x-3">
                <button
                  onClick={() => setParsedData([])}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                >
                  {isSaving ? 'Đang lưu...' : 'Xác nhận Lưu'}
                </button>
              </div>
            </div>

            {/* REVIEW TABLE */}
            <div className="overflow-x-auto max-h-[600px]">
              {importType === 'FINANCE' ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 w-[60px] text-center">STT</th>
                      <th className="px-4 py-3 min-w-[120px]">Ngày</th>
                      <th className="px-4 py-3 min-w-[100px]">Loại</th>
                      <th className="px-4 py-3 min-w-[150px]">Số tiền</th>
                      <th className="px-4 py-3 min-w-[150px]">Loại tiền (Danh mục)</th>
                      <th className="px-4 py-3 min-w-[200px]">Mô tả</th>
                      <th className="px-4 py-3 min-w-[150px]">Tài khoản</th>
                      <th className="px-4 py-3 min-w-[150px]">Người thực hiện</th>
                      <th className="px-4 py-3 min-w-[150px]">Nhóm</th>
                      <th className="px-4 py-3 w-[80px] text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.map((row, index) => (
                      <tr key={row.id} className="hover:bg-slate-100 even:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-center font-medium text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleFieldChange(row.id, 'date', e.target.value)}
                            className={`w-full text-sm border-gray-300 rounded ${!row.date ? 'border-red-500 bg-red-50' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-2 font-bold">
                          <span className={row.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                            {row.type === 'INCOME' ? 'THU' : 'CHI'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={row.amount || ''}
                            onChange={(e) => handleFieldChange(row.id, 'amount', Number(e.target.value))}
                            className={`w-full text-sm border-gray-300 rounded ${!row.amount ? 'border-red-500 bg-red-50' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.categoryName || ''}
                            onChange={(e) => handleFieldChange(row.id, 'categoryName', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded"
                            placeholder="Chi cho việc gì?"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => handleFieldChange(row.id, 'description', e.target.value)}
                            className={`w-full text-sm border-gray-300 rounded ${!row.description ? 'border-red-500 bg-red-50' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.accountId}
                            onChange={(e) => handleFieldChange(row.id, 'accountId', e.target.value)}
                            className={`w-full text-sm border-gray-300 rounded ${!row.accountId ? 'border-red-500 bg-red-50 text-red-600 font-bold' : ''}`}
                          >
                            <option value="">-- Chọn tài khoản --</option>
                            {dependencies?.accounts?.map((acc: any) => (
                              <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.userId || ''}
                            onChange={(e) => handleFieldChange(row.id, 'userId', e.target.value)}
                            className={`w-full text-sm border-gray-300 rounded ${!row.userId ? 'border-amber-300 bg-amber-50' : ''}`}
                          >
                            <option value="">-- Trống --</option>
                            {dependencies?.users?.map((u: any) => (
                              <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.cashFlowGroup}
                            onChange={(e) => handleFieldChange(row.id, 'cashFlowGroup', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded"
                          >
                            <option value="OPERATIONAL">VẬN HÀNH</option>
                            <option value="TRADING">TIỀN HÀNG</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                            title="Xóa dòng này"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 w-[60px] text-center">STT</th>
                      <th className="px-4 py-3 min-w-[150px]">Tên hàng</th>
                      <th className="px-4 py-3 min-w-[100px]">Loại</th>
                      <th className="px-4 py-3 min-w-[80px]">SL</th>
                      <th className="px-4 py-3 min-w-[150px]">Tổng Mua</th>
                      <th className="px-4 py-3 min-w-[150px]">Tổng Bán</th>
                      <th className="px-4 py-3 min-w-[120px]">Bên mua</th>
                      <th className="px-4 py-3 w-[80px] text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.map((row, index) => (
                      <tr key={row.id} className="hover:bg-slate-100 even:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-center font-medium text-gray-500">{index + 1}</td>
                        <td className="px-4 py-2 font-medium">{row.itemName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${row.orderType === 'IMPORT' ? 'bg-blue-100 text-blue-700' : row.orderType === 'EXPORT' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                            {row.orderType}
                          </span>
                        </td>
                        <td className="px-4 py-2">{row.qty}</td>
                        <td className="px-4 py-2 text-red-600 font-medium">{row.buyTotal?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-green-600 font-medium">{row.sellTotal?.toLocaleString()}</td>
                        <td className="px-4 py-2 truncate max-w-[150px]">{row.buyer}</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => handleRemoveRow(row.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
