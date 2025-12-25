import { supabase } from '../supabaseClient';

// Envia imagem e retorna URL pública
export async function uploadInvestigationImage(file: File, investigationId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    // Estrutura de pasta: ID_DO_CASO/nome_arquivo
    const filePath = `${investigationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('investigation-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('investigation-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Upload falhou:', error);
    return null;
  }
}

export default { uploadInvestigationImage };
