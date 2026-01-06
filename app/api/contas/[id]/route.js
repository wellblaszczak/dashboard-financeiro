export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { id } = params;
    
    const res = await fetch(
      `https://mzqqxvbzejumwqvhwgvs.supabase.co/rest/v1/financas_dashboard.contas_pagar?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cXF4dmJ6ZWp1bXdxdmh3Z3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjkwNjIsImV4cCI6MjA3NzM0NTA2Mn0.phJQeAq2Sk77AdLlQ--5Gm_QD2gw9gY6E-9wv0uMWHA',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
