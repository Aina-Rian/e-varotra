export async function verifyAdminPassword(password: string) {
  try {
    // Récupération des variables d'environnement
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase configuration');
    }

    // URL complète de la fonction Edge
    const functionUrl = `${supabaseUrl}/functions/v1/verify-admin`;

    // Appel fetch avec header Authorization Bearer et Content-Type JSON
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ password }),
    });

    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur lors de la vérification : ${response.status}`);
    }

    const result = await response.json();

    // Retourne succès avec données
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Erreur lors de la vérification admin:', error);
    throw new Error(`Échec de la vérification admin : ${error.message}`);
  }
}
