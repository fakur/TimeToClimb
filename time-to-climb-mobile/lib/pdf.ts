import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StockOpname } from './db';

export const generateOpnamePDF = async (opname: StockOpname): Promise<void> => {
  // Format HTML layout that matches the exact PDF template (Letter, tight rows, 1 page)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  let formattedDateTime = '';
  try {
    const dateObj = new Date(opname.tanggal);
    const dayName = days[dateObj.getDay()] || 'Hari';
    
    const dateParts = opname.tanggal.split('-');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
      : opname.tanggal;
      
    formattedDateTime = `${dayName}, ${formattedDate} - ${opname.jam.slice(0, 5)} WIB`;
  } catch (err) {
    formattedDateTime = opname.tanggal;
  }

  let rowsHtml = '';
  opname.details?.forEach((dtl) => {
    const freezer = Number(dtl.stock_freezer) || 0;
    const chiller = Number(dtl.stock_chiller) || 0;
    const itemObj = dtl.item || (dtl as any).mst_stocks;
    const name = itemObj?.nama_barang || `Barang ID ${dtl.item_id}`;
    const unit = itemObj?.satuan || 'Pcs';
    const desc = itemObj?.keterangan || '-';
    
    const displayName = name.toLowerCase().includes('lap (')
      ? `${name} : ( ) ( ) ( ) ( ) ( ) ( )`
      : name;

    rowsHtml += `
      <tr>
        <td style="border: 1px solid #000; padding: 2.2px 6px; font-size: 10.5px; text-transform: capitalize; font-weight: 500;">${displayName}</td>
        <td style="border: 1px solid #000; padding: 2.2px 6px; font-size: 10.5px; text-align: center; font-family: monospace;">${freezer}</td>
        <td style="border: 1px solid #000; padding: 2.2px 6px; font-size: 10.5px; text-align: center; font-family: monospace;">${chiller}</td>
        <td style="border: 1px solid #000; padding: 2.2px 6px; font-size: 10.5px; text-align: center;">${unit}</td>
        <td style="border: 1px solid #000; padding: 2.2px 6px; font-size: 10.5px; text-align: left; font-style: italic; color: #4a5568;">${desc}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Stock Opname</title>
        <style>
          @page {
            size: letter portrait;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0px 0.45in 0.35in 0.45in;
            box-sizing: border-box;
            background: white;
            color: black;
          }
          .title-container {
            text-align: center;
            margin: 0;
            padding: 0;
            margin-top: -2px;
          }
          h1 {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: underline;
            margin: 0;
            padding: 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 500;
            padding-bottom: 4px;
            margin-top: 8px;
            margin-bottom: 0px;
          }
          .meta-row b {
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0px;
          }
          th {
            border: 1px solid #000;
            background-color: #f1f5f9;
            font-weight: bold;
            padding: 2.2px 6px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="title-container">
          <h1>STOCK OPNAME</h1>
        </div>
        <div class="meta-row">
          <div>Hari - Tanggal - Jam : <b>${formattedDateTime}</b></div>
          <div>Checker : <b style="text-transform: capitalize;">${opname.checker}</b></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; width: 300px;">Nama Barang</th>
              <th style="text-align: center; width: 82px;">Stock Freezer</th>
              <th style="text-align: center; width: 82px;">Stock Chiller</th>
              <th style="text-align: center; width: 64px;">Satuan</th>
              <th style="text-align: left; width: 130px;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
