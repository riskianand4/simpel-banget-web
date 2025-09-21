import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ui/theme-provider";
import loginBg from "@/assets/login-bg.jpg";

import {
  Loader2,
  Wifi,
  Eye,
  EyeOff,
  Shield,
  Lock,
  User,
  Mail,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
const ModernLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }
    const ok = await login(email, password);
    if (ok) {
      navigate("/", { replace: true });
    }
  };
  return (
    <div className="min-h-screen bg-muted/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Background Image with Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${loginBg})`,
            filter: "blur(10px)",
            transform: "scale(1.1)", // Prevent blur edge artifacts
          }}
        />

        {/* Dark Overlay - only show in dark theme */}
        {theme === "dark" && <div className="absolute inset-0 bg-black/40" />}
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Branding */}
        <motion.div
          className="hidden lg:flex flex-col justify-center space-y-8 p-8"
          initial={{
            opacity: 0,
            x: -50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <div className="text-center lg:text-left">
            <motion.div
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Icon */}
              <motion.div
                className="flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-glow"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
              >
                <Wifi className="w-8 h-8 text-white" />
              </motion.div>

              {/* Text */}
              <h1 className="text-sm md:text-md lg:text-xl font-bold text-foreground">
                Telnet <span className="text-primary">Inventory</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-xs md:text-sm text-muted-foreground mb-8"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.3,
              }}
            >
              Sistem Manajemen Stok Barang Modern dengan Teknologi Terdepan
            </motion.p>
          </div>

          {/* Features */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.4,
            }}
          >
            {[
              {
                icon: Shield,
                title: "Keamanan Tinggi",
                desc: "Data terproteksi dengan enkripsi",
              },
              {
                icon: CheckCircle2,
                title: "Real-time Updates",
                desc: "Sinkronisasi data secara langsung",
              },
              {
                icon: Lock,
                title: "Role-based Access",
                desc: "Kontrol akses berdasarkan peran",
              },
              {
                icon: Mail,
                title: "Smart Analytics",
                desc: "Analisis data yang mendalam",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex items-center space-x-3 p-4 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-sm"
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.5 + index * 0.1,
                }}
              >
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-xs md:text-sm text-foreground">
                    {feature.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{
            opacity: 0,
            x: 50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.2,
          }}
          className="flex flex-col justify-center mx-0"
        >
          <Card className="backdrop-blur-xl bg-white/10 h-[410px] dark:bg-black/20 border border-white/20 shadow-2xl px-0 mx-[6px]">
            <CardHeader className="text-center pb-6 mt-10">
              <CardTitle className="text-xl md:text-md font-bold text-foreground">
                Masuk ke Sistem
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Gunakan kredensial Anda untuk mengakses dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  className="space-y-2"
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.3,
                  }}
                >
                  <Label
                    htmlFor="email"
                    className="text-xs md:text-sm font-medium"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email"
                      disabled={isLoading}
                      className="pl-10 bg-white/10 dark:bg-black/20 border-white/20 backdrop-blur-sm focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.4,
                  }}
                >
                  <Label
                    htmlFor="password"
                    className="text-xs md:text-sm font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      disabled={isLoading}
                      className="pl-10 pr-10 bg-white/10 dark:bg-black/20 border-white/20 backdrop-blur-sm focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5,
                  }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 backdrop-blur-sm shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Masuk
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
export default ModernLoginPage;
