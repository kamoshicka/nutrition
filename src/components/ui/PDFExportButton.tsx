'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PDFSaveDialog } from './PDFSaveDialog';
import { PDFDownloadButton } from './PDFDownloadButton';
import { 
  generateRecipePDF, 
  generateFoodPDF, 
  generateNutritionCalculationPDF,
  downloadPDF,
  RecipePDFData,
  FoodPDFData,
  NutritionCalculationPDFData
} from '../../lib/pdf-generator';

interface PDFExportButtonProps {
  type: 'recipe' | 'food' | 'nutrition';
  data: RecipePDFData | FoodPDFData | NutritionCalculationPDFData;
  filename?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showDialog?: boolean;
  children?: React.ReactNode;
}

export function PDFExportButton({
  type,
  data,
  filename,
  className = '',
  size = 'md',
  variant = 'primary',
  showDialog = true,
  children
}: PDFExportButtonProps) {
  const { data: session, status } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate default filename based on type and data
  const getDefaultFilename = (): string => {
    if (filename) return filename;
    
    switch (type) {
      case 'recipe':
        return `recipe-${(data as RecipePDFData).name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      case 'food':
        return `food-${(data as FoodPDFData).name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      case 'nutrition':
        return `nutrition-${(data as NutritionCalculationPDFData).name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      default:
        return 'document';
    }
  };

  // Generate PDF based on type
  const generatePDF = async (notes?: string): Promise<void> => {
    let pdfBlob: Blob;
    const dataWithNotes = { ...data, notes };

    switch (type) {
      case 'recipe':
        pdfBlob = await generateRecipePDF(dataWithNotes as RecipePDFData);
        break;
      case 'food':
        pdfBlob = await generateFoodPDF(dataWithNotes as FoodPDFData);
        break;
      case 'nutrition':
        pdfBlob = await generateNutritionCalculationPDF(dataWithNotes as NutritionCalculationPDFData);
        break;
      default:
        throw new Error('Unsupported PDF type');
    }

    downloadPDF(pdfBlob, getDefaultFilename());
  };

  // Handle direct download (without dialog)
  const handleDirectDownload = async (): Promise<void> => {
    await generatePDF();
  };

  // Handle download with dialog
  const handleDialogDownload = async (notes: string): Promise<void> => {
    await generatePDF(notes);
  };

  // Get dialog title based on type
  const getDialogTitle = (): string => {
    switch (type) {
      case 'recipe':
        return 'レシピをPDFで保存';
      case 'food':
        return '食材情報をPDFで保存';
      case 'nutrition':
        return '栄養計算結果をPDFで保存';
      default:
        return 'PDFで保存';
    }
  };

  // Get dialog description based on type
  const getDialogDescription = (): string => {
    switch (type) {
      case 'recipe':
        return 'レシピの詳細情報をPDF形式で保存します。';
      case 'food':
        return '食材の栄養情報と詳細をPDF形式で保存します。';
      case 'nutrition':
        return '栄養計算の結果と比較データをPDF形式で保存します。';
      default:
        return 'データをPDF形式で保存します。';
    }
  };

  // Check if user has premium access
  const hasPremiumAccess = status === 'authenticated' && session?.user?.subscription?.status === 'premium';

  if (showDialog && hasPremiumAccess) {
    return (
      <>
        <PDFDownloadButton
          onDownload={() => setIsDialogOpen(true)}
          filename={getDefaultFilename()}
          className={className}
          size={size}
          variant={variant}
        >
          {children}
        </PDFDownloadButton>

        <PDFSaveDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleDialogDownload}
          title={getDialogTitle()}
          description={getDialogDescription()}
        />
      </>
    );
  }

  // For direct download or non-premium users
  return (
    <PDFDownloadButton
      onDownload={handleDirectDownload}
      filename={getDefaultFilename()}
      className={className}
      size={size}
      variant={variant}
    >
      {children}
    </PDFDownloadButton>
  );
}

export default PDFExportButton;