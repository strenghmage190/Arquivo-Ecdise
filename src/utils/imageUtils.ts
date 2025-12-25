import { supabase } from '../supabaseClient';

export function getImageUrl(path: string) {
  if (!path) return '';
  try {
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('investigation-assets').getPublicUrl(path);
    return data?.publicUrl || '';
  } catch (e) {
    console.error('Erro ao obter URL da imagem', e);
    return '';
  }
}

export default { getImageUrl };
