import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Clothing3DViewer } from './components/Clothing3DViewer';
import { AppStatus, ImageFile, GenerationResult, Pose, Recommendation } from './types';
import { generateTryOn, generateStyleRecommendations, generateProductImage, validateClothingSafety, generateStylistReview } from './services/geminiService';
import { Shirt, ShoppingBag, Wand2, Move3d, User, Camera, RotateCw, AlertCircle, X, ShieldCheck, Sparkles, ChevronRight, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [userImage, setUserImage] = useState<ImageFile | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageFile | null>(null);
  const [clothingModelUrl, setClothingModelUrl] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>("");
  const [rotation, setRotation] = useState<number>(0);
  const [useCustomRotation, setUseCustomRotation] = useState<boolean>(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTryOn = async () => {
    if (!userImage || !clothingImage) return;

    setStatus(AppStatus.PROCESSING);
    setError(null);
    setResult(null);

    const pose: Pose = useCustomRotation ? rotation : 'original';

    try {
      const safetyCheck = await validateClothingSafety(clothingImage.base64);
      if (!safetyCheck.valid) {
        throw new Error(`Safety Alert: ${safetyCheck.reason || "This image cannot be processed due to safety guidelines."}`);
      }

      // Execute all generation tasks in parallel for speed
      const [tryOnResult, recommendations, stylistReview] = await Promise.all([
        generateTryOn(userImage.base64, clothingImage.base64, instructions, pose),
        generateStyleRecommendations(clothingImage.base64),
        generateStylistReview(userImage.base64, clothingImage.base64)
      ]);
      
      setResult({ 
        imageUrl: tryOnResult.imageUrl, 
        recommendations: recommendations,
        feedback: stylistReview
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process the virtual try-on.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setError(null);
  };

  const handleApplyRecommendation = async (rec: Recommendation) => {
    setStatus(AppStatus.PROCESSING); 
    try {
      const base64Image = await generateProductImage(rec);
      const newFile: ImageFile = {
        file: new File([], `${rec.itemName}.png`),
        previewUrl: base64Image,
        base64: base64Image
      };

      setClothingImage(newFile);
      setClothingModelUrl(null);
      setInstructions(`Trying on ${rec.colorHex} ${rec.itemName}`);
      setResult(null);
      setStatus(AppStatus.IDLE);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError("Could not visualize item. Please try again.");
      setStatus(AppStatus.IDLE);
    }
  };

  const handleClothingUpload = (fileData: ImageFile | null) => {
    if (!fileData) {
      setClothingImage(null);
      setClothingModelUrl(null);
      return;
    }
    if (fileData.file.name.match(/\.(glb|gltf)$/i)) {
      setClothingModelUrl(fileData.previewUrl);
      setClothingImage(null);
    } else {
      setClothingModelUrl(null);
      setClothingImage(fileData);
    }
  };

  const handle3DSnapshot = (base64Data: string) => {
    setClothingImage({
      file: new File([], "snapshot.png"),
      previewUrl: base64Data,
      base64: base64Data
    });
  };

  const clearClothing = () => {
    setClothingImage(null);
    setClothingModelUrl(null);
  };

  const isFormValid = userImage !== null && clothingImage !== null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Refined Navbar - Dark */}
      <nav className="glass-panel sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tighter text-white">StyleSwap</span>
            <span className="text-[10px] uppercase tracking-widest bg-white text-black px-2 py-0.5 rounded-full font-bold">Noir</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
             <a href="#" className="hover:text-white transition-colors">Collection</a>
             <a href="#" className="hover:text-white transition-colors">Technology</a>
             <button className="text-white border border-white/20 px-5 py-2 rounded-full hover:bg-white hover:text-black transition-colors">
               Sign In
             </button>
          </div>
          <button className="md:hidden text-white">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <main className="flex-grow max-w-screen-2xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Creative Workflow */}
          <div className="lg:col-span-5 space-y-10">
             <div className="animate-fade-in">
                <h1 className="text-5xl font-serif font-medium text-white mb-4 leading-tight">
                   Virtual <br/> <span className="italic text-slate-500">Fitting Room</span>
                </h1>
                <p className="text-slate-400 text-lg font-light max-w-md">
                   Experience the future of fashion. Visualize any garment on yourself with photorealistic precision.
                </p>
             </div>

             <div className="relative pl-6 border-l border-slate-800 space-y-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                
                {/* Step 1 */}
                <div className="relative">
                   <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-black text-[10px] font-bold text-black">1</span>
                   <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">The Model</h3>
                      <ImageUploader 
                        id="user-upload"
                        label="Upload your photo" 
                        image={userImage} 
                        onImageChange={setUserImage} 
                      />
                   </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                   <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-black text-[10px] font-bold text-black">2</span>
                   <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">The Garment</h3>
                      <div className="relative">
                        {!clothingModelUrl ? (
                          <ImageUploader 
                            id="clothing-upload"
                            label="Upload clothing" 
                            image={clothingImage} 
                            onImageChange={handleClothingUpload}
                            accept="image/*,.glb,.gltf"
                          />
                        ) : (
                          <div className="relative h-64 w-full rounded-none border border-slate-800 bg-slate-900 overflow-hidden">
                            <Clothing3DViewer 
                              url={clothingModelUrl} 
                              onCapture={handle3DSnapshot} 
                            />
                            <button 
                              onClick={clearClothing}
                              className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-slate-400 hover:text-white z-20"
                            >
                              <X size={16} />
                            </button>
                            {clothingImage && (
                              <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-sm shadow flex items-center gap-1">
                                  <Camera size={10} /> Captured
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                   <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-black text-[10px] font-bold text-black">3</span>
                   <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Details & Refinement</h3>
                        <button
                          onClick={() => setUseCustomRotation(!useCustomRotation)}
                          className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
                        >
                          {useCustomRotation ? 'Switch to Auto' : 'Advanced Settings'}
                        </button>
                      </div>

                      {useCustomRotation && (
                        <div className="bg-white/5 p-4 border border-slate-800 mb-4">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-semibold text-slate-300">Target Angle</span>
                             <span className="font-mono text-xs text-slate-400">{rotation}°</span>
                           </div>
                           <input
                              type="range"
                              min="0"
                              max="360"
                              value={rotation}
                              onChange={(e) => setRotation(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                           />
                        </div>
                      )}

                      <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="E.g. Tuck in the shirt, roll up sleeves..."
                        className="w-full px-0 py-3 bg-transparent border-b border-slate-800 focus:border-white outline-none transition-colors resize-none text-sm text-slate-200 placeholder:text-slate-600 font-light"
                        rows={1}
                      />
                   </div>
                </div>

                {/* Generate Button */}
                <div className="pt-6">
                  <button
                    onClick={handleTryOn}
                    disabled={!isFormValid || status === AppStatus.PROCESSING}
                    className={`
                      w-full py-5 px-6 font-bold tracking-widest uppercase text-xs shadow-2xl
                      flex items-center justify-center gap-3
                      transition-all duration-500 ease-out btn-elegant
                      ${isFormValid && status !== AppStatus.PROCESSING
                        ? 'bg-white text-black hover:bg-slate-200' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                  >
                    {status === AppStatus.PROCESSING ? (
                      <>
                         <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                         <span>Processing</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Generate Look
                      </>
                    )}
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
                    <ShieldCheck size={12} />
                    Secure AI Processing
                  </div>
                </div>

             </div>
          </div>

          {/* Right Column: Visual Result */}
          <div className="lg:col-span-7 h-full min-h-[600px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <ResultDisplay 
              status={status} 
              result={result} 
              error={error} 
              onReset={handleReset}
              onApplyRecommendation={handleApplyRecommendation}
            />
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-800/50 mt-auto bg-black/20 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-2">
              <span>© {new Date().getFullYear()} StyleSwap Inc.</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
              <span>All Rights Reserved</span>
           </div>
           <div className="flex items-center gap-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Legal</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;