"use client";

import Link from "next/link";
import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const Footer = () => {
  const footerLinks = {
    platform: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Browse Items", href: "/listings" },
      { label: "Report Lost", href: "/report-lost" },
      { label: "Report Found", href: "/report-found" },
    ],
    support: [
      { label: "Help Center", href: "/help" },
      { label: "Safety Tips", href: "/safety" },
      { label: "Community Guidelines", href: "/guidelines" },
      { label: "Contact Us", href: "/contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  };

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container-tight py-12 md:py-16 px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">
                FindIt<span className="text-primary">Hub</span>
              </span>
            </Link>

            <p className="text-primary-foreground/70 text-sm mb-6 leading-relaxed">
              Reconnecting communities with their lost belongings through the power of collective action.
            </p>

            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/60 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-primary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-primary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                support@findithub.com
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 text-primary" />
                1-800-FIND-IT
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} FindItHub. All rights reserved.
          </p>

          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-primary-foreground/50 hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
