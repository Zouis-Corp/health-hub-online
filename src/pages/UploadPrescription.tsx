import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Camera,
  X,
  CheckCircle,
  Shield,
  Clock,
  Truck,
  Phone,
  ChevronRight,
  Loader2,
  Plus,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddressForm, { AddressFormData } from "@/components/address/AddressForm";
import AddressCard from "@/components/address/AddressCard";

const MAX_ADDRESSES = 5;

const UploadPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { items, totalPrice, clearCart, hasPrescriptionItems } = useCart();
  const { toast } = useToast();
  
  // Get coupon and delivery info from cart page
  const cartState = location.state as { couponId?: string; discountAmount?: number; deliveryFee?: number } | null;
  
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading, refetch: refetchAddresses } = useQuery({
    queryKey: ["user-addresses-checkout"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Set default address when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      const newPreviews: string[] = [];
      
      Array.from(e.dataTransfer.files).forEach(file => {
        if (!file.type.startsWith("image/")) {
          invalidFiles.push(`${file.name} (only images allowed)`);
        } else if (file.size > 2 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (exceeds 2MB limit)`);
        } else {
          validFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      });
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Some files were not added",
          description: invalidFiles.join(", "),
          variant: "destructive",
        });
      }
      
      setFiles([...files, ...validFiles]);
      setFilePreviews([...filePreviews, ...newPreviews]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      const newPreviews: string[] = [];
      
      Array.from(e.target.files).forEach(file => {
        if (!file.type.startsWith("image/")) {
          invalidFiles.push(`${file.name} (only images allowed)`);
        } else if (file.size > 2 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (exceeds 2MB limit)`);
        } else {
          validFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      });
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Some files were not added",
          description: invalidFiles.join(", "),
          variant: "destructive",
        });
      }
      
      setFiles([...files, ...validFiles]);
      setFilePreviews([...filePreviews, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(filePreviews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  // Camera functions
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Use back camera for prescription
      });
      setCameraStream(stream);
      setShowCamera(true);
      setCapturedImage(null);
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        toast({
          title: "Camera access denied",
          description: "Please allow camera access in your browser settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Camera error",
          description: "Unable to access camera. Please try uploading an image instead.",
          variant: "destructive",
        });
      }
      console.error("Camera error:", error);
    }
  }, [toast]);

  const closeCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageDataUrl);
        // Stop the stream after capturing
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }
    }
  }, [cameraStream]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    openCamera();
  }, [openCamera]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;
    
    // Convert base64 to File
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], `prescription_${Date.now()}.jpg`, { type: "image/jpeg" });
    
    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Photo too large",
        description: "The captured photo exceeds 2MB limit. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setFiles(prev => [...prev, file]);
    setFilePreviews(prev => [...prev, capturedImage]);
    closeCamera();
    
    toast({
      title: "Photo added",
      description: "Your prescription photo has been added.",
    });
  }, [capturedImage, closeCamera, toast]);

  // Set video stream when camera opens
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleAddAddress = async (data: AddressFormData) => {
    if (!user) return;
    
    setIsAddressSubmitting(true);
    try {
      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      const { data: newAddress, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          name: data.name,
          phone: data.phone,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          landmark: data.landmark || null,
          is_default: data.is_default || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({ title: "Address added successfully" });
      await refetchAddresses();
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
    } catch (error: any) {
      toast({ 
        title: "Error adding address", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Prescription required",
        description: "Please upload your prescription to continue.",
        variant: "destructive",
      });
      return;
    }

    // Only require address if there are cart items
    if (items.length > 0 && !selectedAddressId) {
      toast({
        title: "Address required",
        description: "Please select or add a delivery address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Two flows:
      // 1. Cart has items → Create order with items, prescription linked
      // 2. No cart items → Create prescription only, admin adds items later

      if (items.length > 0) {
        // Flow 1: Order with cart items
        // Calculate final total with coupon discount and delivery fee
        const discountAmount = cartState?.discountAmount || 0;
        const deliveryFee = cartState?.deliveryFee || 0;
        const finalTotal = totalPrice - discountAmount + deliveryFee;

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            status: "pending_rx",
            total_amount: finalTotal,
            payment_status: "pending",
            address_id: selectedAddressId,
            coupon_id: cartState?.couponId || null,
            discount_amount: discountAmount,
            delivery_fee: deliveryFee,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map((item) => ({
          order_id: orderData.id,
          medicine_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Upload prescription files linked to order
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${orderData.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("prescriptions")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { error: prescriptionError } = await supabase
            .from("prescriptions")
            .insert({
              user_id: user.id,
              order_id: orderData.id,
              file_url: fileName,
              status: "pending",
            });

          if (prescriptionError) throw prescriptionError;
        }

        // Send notification email for prescription upload with order
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'rx-uploaded',
              userId: user.id,
              orderId: orderData.id,
              orderNumber: orderData.order_number,
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }

        // Clear cart and show success
        clearCart();
        setUploadProgress(100);
        setUploadSuccess(true);
        
        // Wait for success animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Order placed successfully!",
          description: "Your prescription is under review. We'll notify you once approved.",
        });
      } else {
        // Flow 2: Direct prescription upload (no cart items)
        // Upload prescription files without an order - admin will add items later
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/direct/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("prescriptions")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { error: prescriptionError } = await supabase
            .from("prescriptions")
            .insert({
              user_id: user.id,
              order_id: null, // No order yet
              file_url: fileName,
              status: "pending",
            });

          if (prescriptionError) throw prescriptionError;
        }

        // Send notification email for direct prescription upload
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'rx-uploaded',
              userId: user.id,
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }

        setUploadProgress(100);
        setUploadSuccess(true);
        
        // Wait for success animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Prescription submitted!",
          description: "Our pharmacist will review your prescription and add medicines. We'll notify you once ready for payment.",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Error submitting prescription",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/80">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeCamera}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
            <span className="text-white font-medium">Take Photo</span>
            <div className="w-10" />
          </div>
          
          {/* Camera View or Captured Image */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured prescription" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          
          {/* Camera Controls */}
          <div className="p-6 bg-black/80">
            {capturedImage ? (
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={retakePhoto}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Retake
                </Button>
                <Button 
                  onClick={confirmPhoto}
                  className="bg-primary hover:bg-primary/90"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Use Photo
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to="/cart" className="hover:text-primary">Cart</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-foreground">Upload Prescription</span>
          </nav>

          {/* Page Header */}
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading mb-1 sm:mb-2">
              Upload Your Prescription
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload your prescription and our pharmacists will process your order
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Quick Processing</span>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">24/7 Support</span>
            </div>
          </div>

          {/* Upload Form */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card">
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-all ${
                dragActive
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-2 sm:space-y-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent rounded-xl flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    Drag & drop your prescription here
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    or use the buttons below
                  </p>
                </div>
                <div className="flex justify-center gap-2 sm:gap-3 relative z-10">
                  {/* Browse Images Button with hidden file input */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3 border-2 border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground font-medium transition-colors">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Browse Images
                    </div>
                  </label>
                  
                  {/* Take Photo Button - opens camera */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 sm:gap-2 rounded-lg text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCamera();
                    }}
                    type="button"
                  >
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Take Photo
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Supported: JPG, PNG, WEBP (Max 2MB each)
                </p>
              </div>
            </div>

            {/* Uploaded Files with Preview */}
            {files.length > 0 && (
              <div className="mt-4 sm:mt-5 space-y-3">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Prescription Preview ({files.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square"
                    >
                      {/* Image Preview */}
                      <img 
                        src={filePreviews[index]} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay with file info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[10px] sm:text-xs text-white font-medium line-clamp-1">
                            {file.name}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-white/70">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center transition-colors shadow-md"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Prescription Info - Show when no cart items */}
            {items.length === 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-1">Direct Prescription Upload</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Upload your prescription and our pharmacist will review it, add the medicines, and notify you when your order is ready for payment.
                </p>
              </div>
            )}

            {/* Delivery Address Section - Only show if cart has items */}
            {items.length > 0 && (
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h3>
                  {!showAddressForm && (addresses?.length || 0) < MAX_ADDRESSES && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 text-xs h-8"
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add New
                    </Button>
                  )}
                </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                  <AddressForm
                    initialData={{ name: profile?.name || "", phone: profile?.phone || "" }}
                    onSubmit={handleAddAddress}
                    onCancel={() => setShowAddressForm(false)}
                    isLoading={isAddressSubmitting}
                    submitLabel="Add Address"
                    showDefaultOption={(addresses?.length || 0) > 0}
                  />
                </div>
              )}

              {/* Address List */}
              {addressesLoading ? (
                <div className="space-y-3">
                  <div className="h-24 bg-muted animate-pulse rounded-lg" />
                </div>
              ) : addresses?.length === 0 && !showAddressForm ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No saved addresses</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Your First Address
                  </Button>
                </div>
              ) : !showAddressForm && (
                <div className="grid gap-3">
                  {addresses?.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isSelected={selectedAddressId === address.id}
                      onSelect={() => setSelectedAddressId(address.id)}
                      selectable
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Order Summary */}
            {items.length > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2 sm:mb-3">Order Summary</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Total</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-4 sm:mt-6">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 sm:h-12 rounded-lg text-sm sm:text-base"
                disabled={isSubmitting || files.length === 0 || (items.length > 0 && !selectedAddressId)}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    {items.length > 0 ? "Place Order" : "Submit Prescription"}
                  </>
                )}
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2 sm:mt-3">
                Our pharmacist will review your prescription and contact you within 2 hours.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-6 sm:mt-10 pb-20 sm:pb-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading text-center mb-4 sm:mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { step: "1", title: "Upload Prescription", desc: "Upload a clear image of your valid prescription" },
                { step: "2", title: "Pharmacist Review", desc: "Our licensed pharmacist reviews your prescription" },
                { step: "3", title: "Fast Delivery", desc: "Medicines delivered to your doorstep" },
              ].map((item) => (
                <div key={item.step} className="text-center p-4 bg-card rounded-xl border border-border">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 font-bold text-sm sm:text-base">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Upload Progress Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            {!uploadSuccess ? (
              <>
                {/* Uploading Animation */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
                  {/* Outer ring */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="8"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary stroke-current transition-all duration-300"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 42}`,
                        strokeDashoffset: `${2 * Math.PI * 42 * (1 - uploadProgress / 100)}`,
                      }}
                    />
                  </svg>
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  Uploading Prescription
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Please wait while we upload your files...
                </p>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {uploadProgress}%
                </div>
              </>
            ) : (
              <>
                {/* Success Animation */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center animate-scale-in shadow-lg">
                    <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                  {/* Celebration particles */}
                  <div className="absolute -top-2 -left-2 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-3 w-2 h-2 bg-primary rounded-full animate-ping delay-100" />
                  <div className="absolute -bottom-2 -left-1 w-2 h-2 bg-secondary rounded-full animate-ping delay-200" />
                  <div className="absolute -bottom-1 -right-2 w-3 h-3 bg-emerald-400 rounded-full animate-ping delay-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  Upload Successful!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Redirecting to your dashboard...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPrescription;
