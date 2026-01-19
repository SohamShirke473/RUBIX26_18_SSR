"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin } from "lucide-react";
import { UserButton } from "@clerk/nextjs";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const navLinks = [
    { href: "/listings", label: "Browse Items" },
    { href: "/report-lost", label: "Report Lost" },
    { href: "/report-found", label: "Report Found" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${isHome
        ? "bg-transparent"
        : "bg-card/95 backdrop-blur-md border-b border-border"
        }`}
    >
      <div className="container-tight px-3">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              FindIt<span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === link.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <UserButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="container-tight py-4 space-y-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 flex gap-3">
            <UserButton />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
