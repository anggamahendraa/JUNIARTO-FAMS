import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding';

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Alamat diperlukan' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return NextResponse.json(
        { error: 'Gagal menemukan koordinat untuk alamat tersebut' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
