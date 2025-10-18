"use client";

import Link from "next/link";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, User } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function Header({ breadcrumbs, actions }: HeaderProps) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-6 h-[60px]">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 h-full text-sm">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center h-full">
            {index > 0 && (
              <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
            )}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="flex items-center h-full text-gray-600 hover:text-gray-900 dark:hover:text-white dark:text-gray-300 transition-colors hover:cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span className="flex items-center h-full font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
