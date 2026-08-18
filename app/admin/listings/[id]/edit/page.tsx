'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ShopForm } from '@/components/admin/ShopForm';

export default function AdminEditShopPage() {
  const { id } = useParams();
  const shopIdStr = Array.isArray(id) ? id[0] : id;

  return <ShopForm id={shopIdStr} />;
}
