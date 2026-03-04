import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Upload, Download, RotateCcw, AlertCircle, CheckCircle, FileText, X } from 'lucide-react';
import { useDeskLayout } from '../context/DeskLayoutContext';
import { desksToCSV, parseCSVToDesks, downloadCSV, readFileAsText } from '../utils/csvParser';
import { validateDesks, sanitizeDesks } from '../utils/deskValidator';
import { Desk } from '../types/desk';

export default function DeskMapImporter() {
  const { desks, setDesks, resetToDefault } = useDeskLayout();
  const [isImporting, setIsImporting] = useState(false);
  const [previewDesks, setPreviewDesks] = useState<Desk[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [, setValidationWarnings] = useState<string[]>([]);
  const [, setSuccessMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    try {
      const csvContent = desksToCSV(desks);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csvContent, `office-layout-${timestamp}.csv`);
      setSuccessMessage('Layout exportado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setValidationErrors(['Error al exportar: ' + (error as Error).message]);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setValidationErrors(['Por favor seleccione un archivo CSV o TXT']);
      return;
    }

    setIsImporting(true);
    setValidationErrors([]);
    setValidationWarnings([]);
    setSuccessMessage('');
    setPreviewDesks(null);

    try {
      // Leer archivo
      const content = await readFileAsText(file);
      
      // Parsear CSV
      const parsedDesks = parseCSVToDesks(content);
      
      // Validar datos
      const validation = validateDesks(parsedDesks);
      
      if (validation.errors.length > 0) {
        setValidationErrors(validation.errors);
        setIsImporting(false);
        return;
      }

      // Mostrar advertencias si existen
      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
      }

      // Sanitizar y mostrar preview
      const sanitized = sanitizeDesks(parsedDesks);
      setPreviewDesks(sanitized);

    } catch (error) {
      setValidationErrors(['Error al procesar archivo: ' + (error as Error).message]);
    } finally {
      setIsImporting(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyImport = () => {
    if (!previewDesks) return;

    setDesks(previewDesks);
    setSuccessMessage(`Layout actualizado: ${previewDesks.length} escritorios importados`);
    setPreviewDesks(null);
    setValidationWarnings([]);
    
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCancelImport = () => {
    setPreviewDesks(null);
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const handleResetToDefault = () => {
    if (confirm('¿Está seguro de restaurar la configuración por defecto? Se perderán los cambios actuales.')) {
      resetToDefault();
      setSuccessMessage('Layout restaurado a configuración por defecto');
      setPreviewDesks(null);
      setValidationErrors([]);
      setValidationWarnings([]);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Errores encontrados:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      

      {/* Preview Section */}
      {previewDesks && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">Vista Previa del Layout</CardTitle>
                <CardDescription className="text-blue-700">
                  {previewDesks.length} escritorios listos para importar
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancelImport}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {previewDesks.slice(0, 50).map((desk) => (
                  <div
                    key={desk.id}
                    className="text-xs p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="font-semibold text-gray-900">{desk.id}</div>
                    <div className="text-gray-600">
                      ({desk.x}, {desk.y})
                    </div>
                  </div>
                ))}
                {previewDesks.length > 50 && (
                  <div className="text-xs p-2 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                    +{previewDesks.length - 50} más
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyImport} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Aplicar Cambios
              </Button>
              <Button variant="outline" onClick={handleCancelImport}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión del Mapa de Oficina</CardTitle>
          <CardDescription>
            Importar, exportar o restaurar la configuración del layout de escritorios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Configuración Actual</div>
                <div className="text-2xl font-bold text-gray-900">{desks.length} escritorios</div>
              </div>
              <Badge variant="outline" className="text-sm">
                <FileText className="w-3 h-3 mr-1" />
                Activo
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Import Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Procesando...' : 'Importar CSV/TXT'}
              </Button>
            </div>

            {/* Export Button */}
            <Button onClick={handleExportCSV} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>

            {/* Reset Button */}
            <Button onClick={handleResetToDefault} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}