"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function PerfilPage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo States
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Camera Modal States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      if (user.image) {
        setPhotoPreview(user.image);
      }
    }
  }, [user]);

  // Reset image error when photo preview changes
  useEffect(() => {
    setImageError(false);
  }, [photoPreview]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 10MB.",
        type: "error",
      });
      return;
    }

    // Limit to PNG or JPEG
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas imagens PNG ou JPEG/JPG são permitidas.",
        type: "error",
      });
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Initialize and open camera
  const openCamera = async () => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    setCameraError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      // Wait for next render cycle so ref is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setCameraError(
        "Não foi possível acessar a câmera. Por favor, verifique as permissões de acesso do seu navegador ou dispositivo."
      );
    }
  };

  // Capture frame from video
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
      }
    }
  };

  // Stop camera tracks
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
  };

  // Close camera modal and cleanup
  const closeCameraModal = () => {
    stopCamera();
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  // Use captured photo
  const confirmCapturedPhoto = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `avatar-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setPhotoFile(file);
          setPhotoPreview(capturedImage);
          closeCameraModal();
          toast({
            title: "Foto capturada",
            description: "A foto da câmera foi selecionada como imagem de perfil.",
            type: "success",
          });
        })
        .catch((err) => {
          console.error("Erro ao processar imagem capturada:", err);
          toast({
            title: "Erro ao carregar imagem",
            description: "Não foi possível usar a imagem da câmera.",
            type: "error",
          });
        });
    }
  };

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite o seu nome.",
        type: "warning",
      });
      return;
    }

    if (password && password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação de senha não coincide com a nova senha digitada.",
        type: "warning",
      });
      return;
    }

    if (password && password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter no mínimo 6 caracteres.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (password) {
        formData.append("password", password);
      }
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Perfil atualizado",
          description: "Seus dados foram salvos com sucesso.",
          type: "success",
        });
        setPassword("");
        setConfirmPassword("");
        setPhotoFile(null);
        await refetchUser();
      } else {
        toast({
          title: "Erro ao atualizar",
          description: data.message || "Ocorreu um erro ao atualizar o perfil.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com o servidor.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Gerenciamento de Perfil
        </h1>

        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Dados do Usuário
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Gerencie suas informações cadastrais, foto de perfil e senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/10">
                <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                  <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-zinc-800/50 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-xs hover:border-slate-400 dark:hover:border-white/30 transition-all">
                    {photoPreview && !imageError ? (
                      <img
                        src={photoPreview}
                        alt="Foto de Perfil"
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">
                        {name ? name.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold">
                    Alterar Foto
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2.5 items-center sm:items-start w-full">
                  <h3 className="text-sm font-semibold text-slate-850 dark:text-zinc-100">
                    Foto do Perfil
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 text-center sm:text-left">
                    Aceita apenas arquivos nos formatos PNG ou JPEG. Limite de tamanho: 10MB.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerFileInput}
                      className="text-xs"
                    >
                      Selecionar Arquivo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openCamera}
                      className="text-xs gap-1.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      Usar Câmera
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-400"
                  >
                    E-mail (Não pode ser alterado)
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-500 text-sm outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Digite seu nome"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 text-sm outline-none focus:border-slate-900 dark:focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-350"
                    >
                      Nova Senha (Mín. 6 caract.)
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Deixe em branco para manter a atual"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 text-sm outline-none focus:border-slate-900 dark:focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm-password"
                      className="text-xs font-semibold text-slate-700 dark:text-zinc-300"
                    >
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 text-sm outline-none focus:border-slate-900 dark:focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="px-5 font-semibold text-sm cursor-pointer"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Premium Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-scale-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 p-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tirar Foto de Perfil
              </h3>
              <button
                onClick={closeCameraModal}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {cameraError ? (
                <div className="text-center p-6 text-red-600 dark:text-red-400 text-sm">
                  <p className="font-semibold mb-2">Erro de Câmera</p>
                  <p>{cameraError}</p>
                </div>
              ) : (
                <div className="relative w-full aspect-video rounded-xl bg-slate-950 overflow-hidden shadow-inner flex items-center justify-center">
                  {!capturedImage ? (
                    <>
                      {/* Video Stream */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]" // mirror effect
                      />
                      <div className="absolute bottom-4 flex justify-center w-full">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="h-14 w-14 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 active:scale-95 shadow-md transition-all cursor-pointer flex items-center justify-center"
                          title="Capturar Foto"
                        >
                          <span className="h-6 w-6 rounded-full bg-white opacity-80" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Captured Image Preview */}
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4">
                        <div className="flex justify-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setCapturedImage(null)}
                            className="bg-white/95 text-slate-800 hover:bg-white text-xs font-semibold shadow-xs"
                          >
                            Tirar Outra
                          </Button>
                          <Button
                            type="button"
                            onClick={confirmCapturedPhoto}
                            className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs"
                          >
                            Confirmar Foto
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
