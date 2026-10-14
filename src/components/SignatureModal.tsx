import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Type,
  Upload,
  Eraser,
  CheckCircle2,
  X,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileSignature,
  RotateCcw,
} from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string, signerName: string, registration?: string) => void;
  roleTitle: string;
  defaultName?: string;
  defaultRegistration?: string;
  existingSignature?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  roleTitle,
  defaultName = '',
  defaultRegistration = '',
  existingSignature = '',
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signerName, setSignerName] = useState(defaultName);
  const [registration, setRegistration] = useState(defaultRegistration);
  const [selectedFont, setSelectedFont] = useState<'cursive' | 'serif' | 'modern'>('cursive');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSignerName(defaultName);
      setRegistration(defaultRegistration);
      setHasDrawn(false);
      setUploadedImage(null);
      // Wait for canvas to mount then initialize
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [isOpen, defaultName, defaultRegistration]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a'; // Deep navy
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If there is an existing signature and in draw mode, could show or leave blank for new draw
    if (existingSignature && existingSignature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = existingSignature;
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const pos = getCanvasCoords(e);
    lastPoint.current = pos;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate image from Typed Name
  const generateTypedSignature = (): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 200;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textToRender = signerName.trim() || 'Assinatura Digital';

    if (selectedFont === 'cursive') {
      ctx.font = 'italic bold 44px "Brush Script MT", "Segoe Script", "Great Vibes", cursive, sans-serif';
    } else if (selectedFont === 'serif') {
      ctx.font = 'italic 36px "Times New Roman", Georgia, serif';
    } else {
      ctx.font = 'bold 32px "Courier New", monospace';
    }

    ctx.fillText(textToRender, tempCanvas.width / 2, tempCanvas.height / 2 - 10);

    // Add tiny timestamp watermark
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    const dateStr = `Validado digitalmente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    ctx.fillText(dateStr, tempCanvas.width / 2, tempCanvas.height / 2 + 40);

    return tempCanvas.toDataURL('image/png');
  };

  const handleConfirm = () => {
    let finalSignatureUrl = '';

    if (activeTab === 'draw') {
      if (!canvasRef.current || !hasDrawn) {
        // Fallback to typed if not drawn but name is present
        if (signerName.trim()) {
          finalSignatureUrl = generateTypedSignature();
        } else {
          alert('Por favor, desenhe a sua assinatura ou digite o seu nome para gerar a validação digital.');
          return;
        }
      } else {
        finalSignatureUrl = canvasRef.current.toDataURL('image/png');
      }
    } else if (activeTab === 'type') {
      if (!signerName.trim()) {
        alert('Por favor, digite o nome do responsável.');
        return;
      }
      finalSignatureUrl = generateTypedSignature();
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        alert('Por favor, selecione uma imagem da assinatura.');
        return;
      }
      finalSignatureUrl = uploadedImage;
    }

    onConfirm(finalSignatureUrl, signerName.trim() || defaultName, registration.trim());
    onClose();
  };

  if (!isOpen) return null;

  const currentDateStr = new Date().toLocaleDateString('pt-BR');
  const currentTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <FileSignature className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Assinatura Digital & Validação Técnica</h3>
              <p className="text-[11px] text-slate-300">
                Responsável: <strong className="text-amber-400">{roleTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Signer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nome Completo do Responsável: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Registro Profissional / Matrícula:
              </label>
              <input
                type="text"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="Ex: MTE/SP 0089421 ou Matr. 4501"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Signature Method Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className="text-xs font-bold text-slate-800">
                Forma de Inclusão da Assinatura:
              </label>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('draw');
                    setTimeout(initCanvas, 50);
                  }}
                  className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'draw'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Desenhar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('type')}
                  className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'type'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Digitar Rúbrica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carregar Imagem</span>
                </button>
              </div>
            </div>

            {/* TAB 1: DRAW CANVAS */}
            {activeTab === 'draw' && (
              <div className="mt-3 space-y-2">
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 p-2 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[160px] bg-white rounded-lg border border-slate-200 cursor-crosshair touch-none shadow-inner"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                      <PenTool className="w-4 h-4 mr-1.5 opacity-60" />
                      <span>Desenhe sua assinatura ou rúbrica aqui usando mouse ou touch</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px]">Dica: utilize a tela de toque no smartphone/tablet para assinar.</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpar Traço</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TYPE SIGNATURE */}
            {activeTab === 'type' && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-600">Estilo da Caligrafia:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFont('cursive')}
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold cursor-pointer ${
                      selectedFont === 'cursive'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Cursiva Clássica
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFont('serif')}
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold cursor-pointer ${
                      selectedFont === 'serif'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Elegante Serif
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFont('modern')}
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold cursor-pointer ${
                      selectedFont === 'modern'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Técnica / Monospaçada
                  </button>
                </div>

                {/* Preview Box */}
                <div className="border-2 border-slate-200 rounded-xl bg-white p-6 text-center min-h-[140px] flex flex-col items-center justify-center space-y-2 shadow-inner">
                  <div
                    className={`text-2xl text-slate-900 tracking-wide select-none ${
                      selectedFont === 'cursive'
                        ? 'italic font-serif'
                        : selectedFont === 'serif'
                        ? 'font-serif italic font-medium'
                        : 'font-mono font-bold'
                    }`}
                    style={{
                      fontFamily:
                        selectedFont === 'cursive'
                          ? '"Brush Script MT", "Segoe Script", cursive'
                          : undefined,
                    }}
                  >
                    {signerName.trim() || 'Digite seu nome acima'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 pt-2 border-t border-slate-100">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>
                      Selo Digital SST • {currentDateStr} às {currentTimeStr}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD IMAGE */}
            {activeTab === 'upload' && (
              <div className="mt-3 space-y-3">
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Clique para enviar imagem da assinatura</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Formatos suportados: PNG, JPG (fundo branco ou transparente)</span>
                </label>

                {uploadedImage && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <img src={uploadedImage} alt="Assinatura" className="max-h-16 object-contain" />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legal / NR Compliance Note */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl flex items-start space-x-2 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Validação Eletrônica Conforme NR-01:</strong> Ao confirmar, o responsável atesta a veracidade das informações da investigação de acidente/quase-acidente e a pertinência técnica dos planos de ação propostos.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Aplicar Assinatura</span>
          </button>
        </div>
      </div>
    </div>
  );
};
