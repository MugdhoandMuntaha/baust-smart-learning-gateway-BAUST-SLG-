"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ADMIN_MODULES = [
  {
    title: "Notices",
    description: "Create, edit, and pin announcements",
    href: "/admin/notices",
    icon: "📢",
    color: "#006B3F",
  },
  {
    title: "Routine",
    description: "Manage weekly class schedule",
    href: "/admin/routine",
    icon: "📅",
    color: "#1B4F72",
  },
  {
    title: "Deadlines",
    description: "Set and track deadlines",
    href: "/admin/deadlines",
    icon: "⏰",
    color: "#DC2626",
  },
  {
    title: "Documents",
    description: "Upload and manage files",
    href: "/admin/documents",
    icon: "📁",
    color: "#C9A800",
  },
];

export default function AdminDashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-[#1A202C]">Admin Dashboard</h1>
        <p className="text-sm text-[#A0AEC0]">
          Manage your class resources from here
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ADMIN_MODULES.map((mod, idx) => (
          <motion.div
            key={mod.href}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -3 }}
          >
            <Link href={mod.href} className="no-underline block">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group">
                <div className="text-3xl mb-3">{mod.icon}</div>
                <h3
                  className="font-semibold text-base mb-1"
                  style={{ color: mod.color }}
                >
                  {mod.title}
                </h3>
                <p className="text-sm text-[#4A5568]">{mod.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
