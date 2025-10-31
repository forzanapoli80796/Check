import { useEffect } from "react";
import { useLocation } from "wouter";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("appAuthenticated") === "true";
    
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [navigate]);
  
  const isAuthenticated = sessionStorage.getItem("appAuthenticated") === "true";
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}