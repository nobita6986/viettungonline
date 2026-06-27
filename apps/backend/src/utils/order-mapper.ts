export function parseAndMapOrderData(rawData: any[], dependencies: any) {
  const { users } = dependencies;
  
  return rawData.map((row, index) => {
    // Read exact standardized columns from prompt
    const orderTypeRaw = String(row['Loại đơn'] || '').trim();
    const itemName = String(row['Tên sản phẩm'] || '').trim();
    const customer = String(row['Khách hàng'] || '').trim();
    
    // Purchase fields
    const buyDateRaw = row['Ngày mua'];
    const buyQty = parseFloat(String(row['SL Mua'] || '0').replace(/,/g, ''));
    const buyPrice = parseFloat(String(row['Đơn giá Mua'] || '0').replace(/,/g, ''));
    const buyStatus = String(row['TT Mua'] || '').trim();

    // Sale fields
    const sellDateRaw = row['Ngày bán'];
    const sellQty = parseFloat(String(row['SL Bán'] || '0').replace(/,/g, ''));
    const sellPrice = parseFloat(String(row['Đơn giá Bán'] || '0').replace(/,/g, ''));
    const sellStatus = String(row['TT Bán'] || '').trim();

    // Determine Order Type strictly from "Loại đơn"
    let orderType = 'TRADING';
    if (orderTypeRaw.toLowerCase().includes('nhập kho')) orderType = 'IMPORT';
    else if (orderTypeRaw.toLowerCase().includes('xuất kho')) orderType = 'EXPORT';
    else if (orderTypeRaw.toLowerCase().includes('thương mại')) orderType = 'TRADING';

    // Parse Dates
    const parseDate = (val: any) => {
      if (!val) return new Date();
      if (typeof val === 'number') return new Date((val - (25567 + 2)) * 86400 * 1000);
      return new Date(val);
    };
    
    const buyDate = parseDate(buyDateRaw);
    const sellDate = parseDate(sellDateRaw);

    // Map Executor
    const executer = String(row['Người thực hiện'] || row['Sale'] || '').trim();
    let userId = null;
    if (executer) {
      const userMatch = (users || []).find((u: any) => 
        u.name?.toLowerCase().includes(executer.toLowerCase()) || 
        executer.toLowerCase().includes(u.name?.toLowerCase() || '')
      );
      if (userMatch) userId = userMatch.id;
    }

    // Recalculate totals
    let finalBuyTotal = 0;
    let finalSellTotal = 0;
    let finalBuyPrice = 0;
    let finalSellPrice = 0;
    let finalQty = 0;

    if (orderType === 'IMPORT' || orderType === 'TRADING') {
      finalBuyPrice = buyPrice;
      finalBuyTotal = buyPrice * buyQty;
      finalQty = buyQty;
    }

    if (orderType === 'EXPORT' || orderType === 'TRADING') {
      finalSellPrice = sellPrice;
      finalSellTotal = sellPrice * sellQty;
      finalQty = orderType === 'TRADING' ? Math.max(buyQty, sellQty) : sellQty; 
    }

    // Transaction Tracing Logic
    const transactions: any[] = [];
    
    // 1. Purchase Transaction (EXPENSE)
    if (buyStatus.toLowerCase().includes('đã thanh toán') && (orderType === 'IMPORT' || orderType === 'TRADING')) {
      transactions.push({
        type: 'EXPENSE',
        amount: finalBuyTotal,
        date: buyDate,
        cashFlowGroup: 'TRADING',
        category: 'Chi phí nhập hàng',
        description: `Thanh toán mua hàng (Auto-map) [ID:LGC_ORD_PUR_${index}]`,
        legacyIdKey: `LGC_ORD_PUR_${index}`,
        accountId: 'TK CT', // Temporary string, mapped in server action
        userId
      });
    }

    // 2. Sale Transaction (INCOME)
    if (sellStatus.toLowerCase().includes('đã thu tiền') && (orderType === 'EXPORT' || orderType === 'TRADING')) {
      transactions.push({
        type: 'INCOME',
        amount: finalSellTotal,
        date: sellDate,
        cashFlowGroup: 'TRADING',
        category: 'Doanh thu bán hàng',
        description: `Thu tiền bán hàng (Auto-map) [ID:LGC_ORD_SAL_${index}]`,
        legacyIdKey: `LGC_ORD_SAL_${index}`,
        accountId: 'TK CT',
        userId
      });
    }

    return {
      id: index,
      orderType,
      itemName,
      qty: finalQty,
      buyPrice: finalBuyPrice,
      sellPrice: finalSellPrice,
      buyTotal: finalBuyTotal,
      sellTotal: finalSellTotal,
      orderDate: orderType === 'EXPORT' ? sellDate.toISOString().split('T')[0] : buyDate.toISOString().split('T')[0],
      buyer: customer,
      purchaseStatusRaw: buyStatus,
      saleStatusRaw: sellStatus,
      transactions,
      userId
    };
  });
}
