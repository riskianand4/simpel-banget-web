import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Lock,
  Mail,
  Phone,
  Building,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { getCurrentUser, updateCurrentUser } from "@/services/userApi";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import { User as UserType } from "@/types/users";
import { useNavigate } from "react-router-dom";
import { getRoleDisplayName } from "@/services/roleMapper";

export default function SettingsPage() {
  return <SettingsPageComponent />;
}

const SettingsPageComponent: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useApp();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await getCurrentUser();
        if (profile) {
          setUser(profile);
          setFormData({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            department: profile.department || "",
            position: profile.position || "",
          });
        } else {
          toast.error("Gagal memuat profil pengguna");
        }
      } catch (error) {
        toast.error("Gagal memuat profil pengguna");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleBack = () => {
    try {
      const state = (window.history && (window.history as any).state) as any;
      const hasIndex = state && typeof state.idx === "number" && state.idx > 0;
      if (hasIndex || window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/", {
          replace: true,
        });
      }
    } catch {
      navigate("/", {
        replace: true,
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Format nomor telepon tidak valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user || !validateForm()) return;
    setSaving(true);
    try {
      const updatedUser = await updateCurrentUser(formData);
      if (updatedUser) {
        setUser(updatedUser);
        toast.success("Profil berhasil diperbarui");
      } else {
        toast.error("Gagal memperbarui profil");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 md:w-8 md:h-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Profil</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Kelola profil dan pengaturan akun Anda
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-muted-foreground">
              Gagal memuat profil pengguna
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=" p-3 mx-auto  md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <User className="w-4 h-4 md:w-5 md:h-5" />
              Profil Saya
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 pt-0">
            <div className="flex flex-col items-center space-y-3 md:space-y-4">
              <Avatar className="w-16 h-16 md:w-20 md:h-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-base md:text-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-sm md:text-base break-words">{user.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground break-all">{user.email}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-xs md:text-sm">
              <div className="flex items-start gap-2">
                <Building className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">Departemen:</span>
                  <span className="ml-1 break-words">{user.department || "Tidak ada"}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">Posisi:</span>
                  <span className="ml-1 break-words">{user.position || "Tidak ada"}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">Telepon:</span>
                  <span className="ml-1 break-words">{user.phone || "Belum diset"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>
                Bergabung:{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("id-ID")
                  : "-"}
              </p>
              {user.lastLogin && (
                <p>
                  Login terakhir:{" "}
                  {new Date(user.lastLogin).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg">Edit Profil</CardTitle>
            <CardDescription className="text-xs md:text-sm">Perbarui informasi profil Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 pt-0">
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-xs md:text-sm">
                  <User className="w-3 h-3 md:w-4 md:h-4" />
                  Nama Lengkap *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Masukkan nama lengkap"
                  className={`text-sm ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-xs md:text-sm">
                  <Mail className="w-3 h-3 md:w-4 md:h-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="user@example.com"
                  className={`text-sm ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs md:text-sm">
                  <Phone className="w-3 h-3 md:w-4 md:h-4" />
                  No. Telepon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+62 812 3456 7890"
                  className={`text-sm ${errors.phone ? "border-destructive" : ""}`}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-xs md:text-sm">
                  <Building className="w-3 h-3 md:w-4 md:h-4" />
                  Departemen
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  placeholder="IT, HR, Finance, dll"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="position" className="flex items-center gap-2 text-xs md:text-sm">
                  <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
                  Posisi/Jabatan
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                  placeholder="Manager, Staff, Developer, dll"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 md:pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving} className="text-sm">
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Lock className="w-4 h-4 md:w-5 md:h-5" />
              Keamanan
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Kelola pengaturan keamanan akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 border rounded-lg">
              <div className="min-w-0">
                <h4 className="font-medium text-sm md:text-base">Password</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Ubah password untuk menjaga keamanan akun Anda
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(true)}
                className="flex items-center gap-2 text-xs md:text-sm shrink-0"
                size="sm"
              >
                <Lock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Ubah Password</span>
                <span className="sm:hidden">Ubah</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  );
};

export { SettingsPageComponent as SettingsPage };