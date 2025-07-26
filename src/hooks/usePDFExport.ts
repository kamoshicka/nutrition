'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  generateRecipePDF, 
  generateFoodPDF, 
  generateNutritionCalculationPDF,
  downloadPDF,
  RecipePDFData,
  FoodPDFData,
  NutritionCalculationPDFData
} from '../lib/pdf-generator';

interface UsePDFExportOptions {
  onSuccess?: (filename: string) => void;
  onError?: (error: Error) => void;
}

export function usePDFExport(options: UsePDFExportOptions = {}) {
  const { data: session, status } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onSuccess, onError } = options;

  // Check if user can export PDFs
  const canExportPDF = status === 'authenticated' && session?.user?.subscription?.status === 'premium';

  // Export recipe PDF
  const exportRecipePDF = useCallback(async (
    recipeData: RecipePDFData,
    filename?: string
  ): Promise<void> => {
    if (!canExportPDF) {
      const error = new Error('Premium subscription required for PDF export');
      setError(error.message);
      onError?.(error);
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const pdfBlob = await generateRecipePDF(recipeData);
      const finalFilename = filename || `recipe-${recipeData.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      downloadPDF(pdfBlob, finalFilename);
      onSuccess?.(finalFilename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF export failed';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsExporting(false);
    }
  }, [canExportPDF, onSuccess, onError]);

  // Export food PDF
  const exportFoodPDF = useCallback(async (
    foodData: FoodPDFData,
    filename?: string
  ): Promise<void> => {
    if (!canExportPDF) {
      const error = new Error('Premium subscription required for PDF export');
      setError(error.message);
      onError?.(error);
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const pdfBlob = await generateFoodPDF(foodData);
      const finalFilename = filename || `food-${foodData.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      downloadPDF(pdfBlob, finalFilename);
      onSuccess?.(finalFilename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF export failed';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsExporting(false);
    }
  }, [canExportPDF, onSuccess, onError]);

  // Export nutrition calculation PDF
  const exportNutritionPDF = useCallback(async (
    calculationData: NutritionCalculationPDFData,
    filename?: string
  ): Promise<void> => {
    if (!canExportPDF) {
      const error = new Error('Premium subscription required for PDF export');
      setError(error.message);
      onError?.(error);
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const pdfBlob = await generateNutritionCalculationPDF(calculationData);
      const finalFilename = filename || `nutrition-${calculationData.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      downloadPDF(pdfBlob, finalFilename);
      onSuccess?.(finalFilename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF export failed';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsExporting(false);
    }
  }, [canExportPDF, onSuccess, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get export status message
  const getStatusMessage = useCallback((): string | null => {
    if (!session) {
      return 'PDF export requires login';
    }
    
    if (!canExportPDF) {
      return 'PDF export is a premium feature';
    }
    
    if (isExporting) {
      return 'Generating PDF...';
    }
    
    if (error) {
      return error;
    }
    
    return null;
  }, [session, canExportPDF, isExporting, error]);

  return {
    // Export functions
    exportRecipePDF,
    exportFoodPDF,
    exportNutritionPDF,
    
    // State
    isExporting,
    error,
    canExportPDF,
    
    // Utilities
    clearError,
    getStatusMessage
  };
}

export default usePDFExport;