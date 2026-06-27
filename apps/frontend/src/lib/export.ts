export class ExportUtils {
  /**
   * Chuyển đổi mảng object thành chuỗi CSV
   */
  static convertToCSV(data: any[], headers: Record<string, string>): string {
    if (!data || data.length === 0) return '';

    // Lấy danh sách keys từ headers object mapping
    const keys = Object.keys(headers);
    const headerRow = keys.map(key => `"${headers[key]}"`).join(',');

    const rows = data.map(item => {
      return keys.map(key => {
        let val = item[key];
        
        // Handle null/undefined
        if (val === null || val === undefined) val = '';
        
        // Handle Date objects
        if (val instanceof Date) {
          val = val.toLocaleDateString('vi-VN');
        }
        
        // Handle nested objects
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }

        // Escape quotes
        val = val.toString().replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });

    // Thêm BOM (Byte Order Mark) để Excel nhận dạng tiếng Việt UTF-8
    const BOM = '\uFEFF';
    return BOM + [headerRow, ...rows].join('\n');
  }

  /**
   * Tải xuống file CSV ở Browser
   */
  static downloadCSV(data: any[], headers: Record<string, string>, filename: string) {
    const csvContent = this.convertToCSV(data, headers);
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
