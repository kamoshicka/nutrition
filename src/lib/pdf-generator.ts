import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF generation system for premium users
 */

export interface PDFOptions {
  title: string;
  subtitle?: string;
  content: string | HTMLElement;
  notes?: string;
  includeTimestamp?: boolean;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export interface RecipePDFData {
  name: string;
  description?: string;
  category?: string;
  ingredients: Array<{
    name: string;
    amount?: string;
    unit?: string;
  }>;
  instructions?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
    fiber?: number;
    sodium?: number;
  };
  cookingTime?: string;
  servings?: number;
  difficulty?: string;
  tags?: string[];
  imageUrl?: string;
  notes?: string;
}

export interface FoodPDFData {
  name: string;
  description?: string;
  category?: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sodium: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    vitaminA?: number;
    vitaminB1?: number;
    vitaminB2?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
  };
  healthBenefits?: string[];
  cookingMethods?: string[];
  seasonality?: string;
  storageInfo?: string;
  imageUrl?: string;
  notes?: string;
}

export interface NutritionCalculationPDFData {
  name: string;
  selectedFoods: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
  nutritionTotals: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sodium: number;
    totalWeight: number;
  };
  comparison?: Array<{
    nutrient: string;
    name: string;
    unit: string;
    current: number;
    recommended: number;
    percentage: number;
    status: string;
    message: string;
  }>;
  ageGroup?: string;
  gender?: string;
  calculatedAt: Date;
  notes?: string;
}

/**
 * Generate PDF from HTML content
 */
export async function generatePDFFromHTML(options: PDFOptions): Promise<Blob> {
  const {
    title,
    subtitle,
    content,
    notes,
    includeTimestamp = true,
    format = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, yPosition);
    yPosition += 15;

    // Add subtitle if provided
    if (subtitle) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, margin, yPosition);
      yPosition += 10;
    }

    // Add timestamp if requested
    if (includeTimestamp) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const timestamp = new Date().toLocaleString('ja-JP');
      pdf.text(`生成日時: ${timestamp}`, margin, yPosition);
      yPosition += 15;
    }

    // Add content
    if (typeof content === 'string') {
      // Text content
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * 5;
    } else {
      // HTML element - convert to canvas first
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if image fits on current page
      if (yPosition + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    }

    // Add notes if provided
    if (notes && notes.trim()) {
      // Check if we need a new page
      if (yPosition + 30 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('メモ:', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const noteLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin);
      pdf.text(noteLines, margin, yPosition);
    }

    // Return PDF as blob
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF生成に失敗しました');
  }
}

/**
 * Generate recipe PDF
 */
export async function generateRecipePDF(recipeData: RecipePDFData): Promise<Blob> {
  const {
    name,
    description,
    category,
    ingredients,
    instructions,
    nutritionInfo,
    cookingTime,
    servings,
    difficulty,
    tags,
    notes
  } = recipeData;

  // Create HTML content for the recipe
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">${name}</h1>
      
      ${description ? `<p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">${description}</p>` : ''}
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        ${category ? `<div><strong>カテゴリ:</strong> ${category}</div>` : ''}
        ${cookingTime ? `<div><strong>調理時間:</strong> ${cookingTime}</div>` : ''}
        ${servings ? `<div><strong>人数:</strong> ${servings}人分</div>` : ''}
        ${difficulty ? `<div><strong>難易度:</strong> ${difficulty}</div>` : ''}
      </div>

      <h2 style="color: #059669; border-bottom: 1px solid #059669; padding-bottom: 5px;">材料</h2>
      <ul style="list-style-type: none; padding: 0;">
        ${ingredients.map(ingredient => `
          <li style="padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: bold;">${ingredient.name}</span>
            ${ingredient.amount ? ` - ${ingredient.amount}${ingredient.unit || ''}` : ''}
          </li>
        `).join('')}
      </ul>

      ${instructions && instructions.length > 0 ? `
        <h2 style="color: #dc2626; border-bottom: 1px solid #dc2626; padding-bottom: 5px; margin-top: 30px;">作り方</h2>
        <ol>
          ${instructions.map(instruction => `<li style="margin-bottom: 10px; line-height: 1.6;">${instruction}</li>`).join('')}
        </ol>
      ` : ''}

      ${nutritionInfo ? `
        <h2 style="color: #7c3aed; border-bottom: 1px solid #7c3aed; padding-bottom: 5px; margin-top: 30px;">栄養情報（1人分）</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
          ${nutritionInfo.calories ? `<div><strong>エネルギー:</strong> ${nutritionInfo.calories}kcal</div>` : ''}
          ${nutritionInfo.protein ? `<div><strong>たんぱく質:</strong> ${nutritionInfo.protein}g</div>` : ''}
          ${nutritionInfo.fat ? `<div><strong>脂質:</strong> ${nutritionInfo.fat}g</div>` : ''}
          ${nutritionInfo.carbohydrates ? `<div><strong>炭水化物:</strong> ${nutritionInfo.carbohydrates}g</div>` : ''}
          ${nutritionInfo.fiber ? `<div><strong>食物繊維:</strong> ${nutritionInfo.fiber}g</div>` : ''}
          ${nutritionInfo.sodium ? `<div><strong>ナトリウム:</strong> ${nutritionInfo.sodium}mg</div>` : ''}
        </div>
      ` : ''}

      ${tags && tags.length > 0 ? `
        <div style="margin-top: 30px;">
          <strong>タグ:</strong>
          ${tags.map(tag => `<span style="background: #f3f4f6; padding: 4px 8px; margin: 2px; border-radius: 4px; font-size: 12px;">${tag}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Create temporary div for HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    const pdfBlob = await generatePDFFromHTML({
      title: `レシピ: ${name}`,
      subtitle: category ? `カテゴリ: ${category}` : undefined,
      content: tempDiv,
      notes,
      includeTimestamp: true
    });

    return pdfBlob;
  } finally {
    // Clean up temporary element
    document.body.removeChild(tempDiv);
  }
}

/**
 * Generate food information PDF
 */
export async function generateFoodPDF(foodData: FoodPDFData): Promise<Blob> {
  const {
    name,
    description,
    category,
    nutritionPer100g,
    healthBenefits,
    cookingMethods,
    seasonality,
    storageInfo,
    notes
  } = foodData;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">${name}</h1>
      
      ${description ? `<p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">${description}</p>` : ''}
      
      ${category ? `<div style="margin-bottom: 20px;"><strong>カテゴリ:</strong> ${category}</div>` : ''}

      <h2 style="color: #059669; border-bottom: 1px solid #059669; padding-bottom: 5px;">栄養成分（100gあたり）</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div><strong>エネルギー:</strong> ${nutritionPer100g.calories}kcal</div>
        <div><strong>たんぱく質:</strong> ${nutritionPer100g.protein}g</div>
        <div><strong>脂質:</strong> ${nutritionPer100g.fat}g</div>
        <div><strong>炭水化物:</strong> ${nutritionPer100g.carbohydrates}g</div>
        <div><strong>食物繊維:</strong> ${nutritionPer100g.fiber}g</div>
        <div><strong>ナトリウム:</strong> ${nutritionPer100g.sodium}mg</div>
        ${nutritionPer100g.potassium ? `<div><strong>カリウム:</strong> ${nutritionPer100g.potassium}mg</div>` : ''}
        ${nutritionPer100g.calcium ? `<div><strong>カルシウム:</strong> ${nutritionPer100g.calcium}mg</div>` : ''}
        ${nutritionPer100g.iron ? `<div><strong>鉄:</strong> ${nutritionPer100g.iron}mg</div>` : ''}
        ${nutritionPer100g.vitaminA ? `<div><strong>ビタミンA:</strong> ${nutritionPer100g.vitaminA}μg</div>` : ''}
        ${nutritionPer100g.vitaminB1 ? `<div><strong>ビタミンB1:</strong> ${nutritionPer100g.vitaminB1}mg</div>` : ''}
        ${nutritionPer100g.vitaminB2 ? `<div><strong>ビタミンB2:</strong> ${nutritionPer100g.vitaminB2}mg</div>` : ''}
        ${nutritionPer100g.vitaminC ? `<div><strong>ビタミンC:</strong> ${nutritionPer100g.vitaminC}mg</div>` : ''}
        ${nutritionPer100g.vitaminD ? `<div><strong>ビタミンD:</strong> ${nutritionPer100g.vitaminD}μg</div>` : ''}
        ${nutritionPer100g.vitaminE ? `<div><strong>ビタミンE:</strong> ${nutritionPer100g.vitaminE}mg</div>` : ''}
      </div>

      ${healthBenefits && healthBenefits.length > 0 ? `
        <h2 style="color: #dc2626; border-bottom: 1px solid #dc2626; padding-bottom: 5px;">健康効果</h2>
        <ul>
          ${healthBenefits.map(benefit => `<li style="margin-bottom: 5px; line-height: 1.6;">${benefit}</li>`).join('')}
        </ul>
      ` : ''}

      ${cookingMethods && cookingMethods.length > 0 ? `
        <h2 style="color: #7c3aed; border-bottom: 1px solid #7c3aed; padding-bottom: 5px;">調理方法</h2>
        <ul>
          ${cookingMethods.map(method => `<li style="margin-bottom: 5px;">${method}</li>`).join('')}
        </ul>
      ` : ''}

      ${seasonality ? `
        <h2 style="color: #059669; border-bottom: 1px solid #059669; padding-bottom: 5px;">旬の時期</h2>
        <p>${seasonality}</p>
      ` : ''}

      ${storageInfo ? `
        <h2 style="color: #d97706; border-bottom: 1px solid #d97706; padding-bottom: 5px;">保存方法</h2>
        <p>${storageInfo}</p>
      ` : ''}
    </div>
  `;

  // Create temporary div for HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    const pdfBlob = await generatePDFFromHTML({
      title: `食材情報: ${name}`,
      subtitle: category ? `カテゴリ: ${category}` : undefined,
      content: tempDiv,
      notes,
      includeTimestamp: true
    });

    return pdfBlob;
  } finally {
    // Clean up temporary element
    document.body.removeChild(tempDiv);
  }
}

/**
 * Generate nutrition calculation PDF
 */
export async function generateNutritionCalculationPDF(calculationData: NutritionCalculationPDFData): Promise<Blob> {
  const {
    name,
    selectedFoods,
    nutritionTotals,
    comparison,
    ageGroup,
    gender,
    calculatedAt,
    notes
  } = calculationData;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">栄養計算結果: ${name}</h1>
      
      <div style="margin-bottom: 20px; color: #6b7280;">
        <div><strong>計算日時:</strong> ${calculatedAt.toLocaleString('ja-JP')}</div>
        ${ageGroup && gender ? `<div><strong>対象:</strong> ${ageGroup}歳 ${gender === 'male' ? '男性' : '女性'}</div>` : ''}
        <div><strong>総重量:</strong> ${nutritionTotals.totalWeight.toFixed(1)}g</div>
      </div>

      <h2 style="color: #059669; border-bottom: 1px solid #059669; padding-bottom: 5px;">選択した食材</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">食材名</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">カテゴリ</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">数量</th>
          </tr>
        </thead>
        <tbody>
          ${selectedFoods.map(food => `
            <tr>
              <td style="border: 1px solid #e5e7eb; padding: 8px;">${food.name}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px;">${food.category}</td>
              <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${food.quantity}${food.unit}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2 style="color: #dc2626; border-bottom: 1px solid #dc2626; padding-bottom: 5px;">栄養価合計</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px;">
          <div style="font-weight: bold; color: #1e40af;">エネルギー</div>
          <div style="font-size: 18px; font-weight: bold;">${Math.round(nutritionTotals.calories)}kcal</div>
        </div>
        <div style="background: #dcfce7; padding: 15px; border-radius: 8px;">
          <div style="font-weight: bold; color: #166534;">たんぱく質</div>
          <div style="font-size: 18px; font-weight: bold;">${(Math.round(nutritionTotals.protein * 10) / 10)}g</div>
        </div>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
          <div style="font-weight: bold; color: #92400e;">脂質</div>
          <div style="font-size: 18px; font-weight: bold;">${(Math.round(nutritionTotals.fat * 10) / 10)}g</div>
        </div>
        <div style="background: #f3e8ff; padding: 15px; border-radius: 8px;">
          <div style="font-weight: bold; color: #6b21a8;">炭水化物</div>
          <div style="font-size: 18px; font-weight: bold;">${(Math.round(nutritionTotals.carbohydrates * 10) / 10)}g</div>
        </div>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
          <div style="font-weight: bold; color: #0c4a6e;">食物繊維</div>
          <div style="font-size: 18px; font-weight: bold;">${(Math.round(nutritionTotals.fiber * 10) / 10)}g</div>
        </div>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
          <div style="font-weight: bold; color: #991b1b;">ナトリウム</div>
          <div style="font-size: 18px; font-weight: bold;">${Math.round(nutritionTotals.sodium)}mg</div>
        </div>
      </div>

      ${comparison && comparison.length > 0 ? `
        <h2 style="color: #7c3aed; border-bottom: 1px solid #7c3aed; padding-bottom: 5px;">推奨摂取量との比較</h2>
        <div style="margin-bottom: 30px;">
          ${comparison.map(comp => `
            <div style="margin-bottom: 15px; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: bold;">${comp.name}</span>
                <span style="color: #6b7280;">${comp.current} / ${comp.recommended} ${comp.unit} (${comp.percentage}%)</span>
              </div>
              <div style="width: 100%; background: #e5e7eb; border-radius: 4px; height: 8px; margin-bottom: 8px;">
                <div style="height: 8px; border-radius: 4px; width: ${Math.min(comp.percentage, 100)}%; background: ${
                  comp.status === 'low' ? '#ef4444' :
                  comp.status === 'adequate' ? '#10b981' :
                  comp.status === 'high' ? '#3b82f6' :
                  '#f59e0b'
                };"></div>
              </div>
              <p style="margin: 0; font-size: 14px; color: #4b5563;">${comp.message}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Create temporary div for HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    const pdfBlob = await generatePDFFromHTML({
      title: `栄養計算結果: ${name}`,
      subtitle: ageGroup && gender ? `${ageGroup}歳 ${gender === 'male' ? '男性' : '女性'}` : undefined,
      content: tempDiv,
      notes,
      includeTimestamp: false // Already included in content
    });

    return pdfBlob;
  } finally {
    // Clean up temporary element
    document.body.removeChild(tempDiv);
  }
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}