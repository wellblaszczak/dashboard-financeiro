'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Edit2, Trash2, Save, X } from 'lucide-react';

const SUPABASE_URL = 'https://mzqqxvbzejumwqvhwgvs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cXF4dmJ6ZWp1bXdxdmh3Z3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjkwNjIsImV4cCI6MjA3NzM0NTA2Mn0.phJQeAq2Sk77AdLlQ--5Gm_QD2gw9gY6E-9wv0uMWHA';

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function DashboardFinanceiro() {
  const [transacoes, setTransacoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
  const [aba, setAba] = useState('dashboard');
  const [editando, setEditando] = useState(null);
  const [novaTransacao, setNovaTransacao] = useState({ data: '', tipo: 'despesa', categoria: '', valor: '', descricao: '' });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [resTransacoes, resContas] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/financas_dashboard.transacoes`, {
          headers: { 'apikey': SUPABASE_KEY }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/financas_dashboard.contas_pagar`, {
          headers: { 'apikey': SUPABASE_KEY }
        })
      ]);

      const transacoesData = await resTransacoes.json();
      const contasData = await resContas.json();

      setTransacoes(Array.isArray(transacoesData) ? transacoesData : []);
      setContas(Array.isArray(contasData) ? contasData : []);
    } catch (erro) {
      console.error('Erro ao carregar:', erro);
    } finally {
      setLoading(false);
    }
  };

  const salvarTransacao = async () => {
    if (!novaTransacao.data || !novaTransacao.categoria || !novaTransacao.valor) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const dados = {
        data: novaTransacao.data,
        tipo: novaTransacao.tipo,
        categoria: novaTransacao.categoria,
        valor: parseFloat(novaTransacao.valor),
        descricao: novaTransacao.descricao
      };

      if (editando) {
        await fetch(`${SUPABASE_URL}/rest/v1/financas_dashboard.transacoes?id=eq.${editando}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/financas_dashboard.transacoes`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });
      }

      setNovaTransacao({ data: '', tipo: 'despesa', categoria: '', valor: '', descricao: '' });
      setEditando(null);
      await carregarDados();
    } catch (erro) {
      console.error('Erro:', erro);
    }
  };

  const deletarTransacao = async (id) => {
    if (!confirm('Deletar?')) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/financas_dashboard.transacoes?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY }
      });
      await carregarDados();
    } catch (erro) {
      console.error('Erro:', erro);
    }
  };

  const atualizarStatusConta = async (id, novoStatus) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/financas_dashboard.contas_pagar?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      await carregarDados();
    } catch (erro) {
      console.error('Erro:', erro);
    }
  };

  const transacoesMes = transacoes.filter(t => t.data?.startsWith(filtroMes));
  const totalGanhos = transacoesMes.filter(t => t.tipo === 'ganho').reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
  const saldoTotal = transacoes.reduce((sum, t) => sum + (t.tipo === 'ganho' ? t.valor : -t.valor), 0);

  const contasAtivas = contas.filter(c => c.status !== 'pago');
  const totalContasAtivas = contasAtivas.reduce((sum, c) => sum + (c.valor_esperado || 0), 0);

  const dadosPizza = transacoesMes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => {
      const existe = acc.find(d => d.name === t.categoria);
      if (existe) existe.value += t.valor;
      else acc.push({ name: t.categoria, value: t.valor });
      return acc;
    }, []);

  const dadosLinha = Object.entries(
    transacoesMes.reduce((acc, t) => {
      if (!acc[t.data]) acc[t.data] = { data: t.data, ganhos: 0, despesas: 0 };
      if (t.tipo === 'ganho') acc[t.data].ganhos += t.valor;
      else acc[t.data].despesas += t.valor;
      return acc;
    }, {})
  ).map(([_, v]) => v).sort((a, b) => a.data.localeCompare(b.data));

  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">💰 Dashboard Financeiro</h1>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <p className="text-gray-200 text-sm">Total de Ganhos</p>
            <p className="text-3xl font-bold">R$ {totalGanhos.toFixed(2)}</p>
          </div>
          <div className="bg-red-600 p-6 rounded-lg">
            <p className="text-gray-200 text-sm">Total de Despesas</p>
            <p className="text-3xl font-bold">R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <p className="text-gray-200 text-sm">Saldo Total</p>
            <p className="text-3xl font-bold">R$ {saldoTotal.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-600 p-6 rounded-lg">
            <p className="text-gray-200 text-sm">Contas a Pagar</p>
            <p className="text-3xl font-bold">R$ {totalContasAtivas.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button onClick={() => setAba('dashboard')} className={`px-4 py-2 ${aba === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}>Dashboard</button>
          <button onClick={() => setAba('transacoes')} className={`px-4 py-2 ${aba === 'transacoes' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}>Transações</button>
          <button onClick={() => setAba('contas')} className={`px-4 py-2 ${aba === 'contas' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}>Contas a Pagar</button>
        </div>

        {aba === 'dashboard' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Gastos por Categoria</h2>
              {dadosPizza.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={dadosPizza} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {dadosPizza.map((_, idx) => <Cell key={idx} fill={colors[idx % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400">Sem dados</p>}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Gastos vs Ganhos</h2>
              {dadosLinha.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosLinha}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="data" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="ganhos" stroke="#10B981" name="Ganhos" />
                    <Line type="monotone" dataKey="despesas" stroke="#EF4444" name="Despesas" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400">Sem dados</p>}
            </div>
          </div>
        )}

        {aba === 'transacoes' && (
          <div>
            <div className="mb-6">
              <label className="block text-sm mb-2">Filtrar por Mês:</label>
              <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="bg-gray-700 text-white px-4 py-2 rounded w-40" />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-bold mb-4">{editando ? 'Editar' : 'Nova'} Transação</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="date" value={novaTransacao.data} onChange={(e) => setNovaTransacao({ ...novaTransacao, data: e.target.value })} className="bg-gray-700 text-white px-3 py-2 rounded" />
                <select value={novaTransacao.tipo} onChange={(e) => setNovaTransacao({ ...novaTransacao, tipo: e.target.value })} className="bg-gray-700 text-white px-3 py-2 rounded">
                  <option value="despesa">Despesa</option>
                  <option value="ganho">Ganho</option>
                </select>
                <input type="text" placeholder="Categoria" value={novaTransacao.categoria} onChange={(e) => setNovaTransacao({ ...novaTransacao, categoria: e.target.value })} className="bg-gray-700 text-white px-3 py-2 rounded" />
                <input type="number" placeholder="Valor" value={novaTransacao.valor} onChange={(e) => setNovaTransacao({ ...novaTransacao, valor: e.target.value })} className="bg-gray-700 text-white px-3 py-2 rounded" />
                <input type="text" placeholder="Descrição" value={novaTransacao.descricao} onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })} className="bg-gray-700 text-white px-3 py-2 rounded col-span-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={salvarTransacao} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"><Save size={18} /> Salvar</button>
                {editando && <button onClick={() => { setEditando(null); setNovaTransacao({ data: '', tipo: 'despesa', categoria: '', valor: '', descricao: '' }); }} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"><X size={18} /> Cancelar</button>}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Categoria</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoesMes.sort((a, b) => b.data.localeCompare(a.data)).map(t => (
                    <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="p-3">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${t.tipo === 'ganho' ? 'bg-green-600' : 'bg-red-600'}`}>{t.tipo}</span></td>
                      <td className="p-3">{t.categoria}</td>
                      <td className="p-3 text-right">R$ {t.valor.toFixed(2)}</td>
                      <td className="p-3">{t.descricao || '-'}</td>
                      <td className="p-3 text-center flex gap-2 justify-center">
                        <button onClick={() => { setEditando(t.id); setNovaTransacao(t); }} className="text-blue-400"><Edit2 size={16} /></button>
                        <button onClick={() => deletarTransacao(t.id)} className="text-red-400"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aba === 'contas' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 text-left">Conta</th>
                  <th className="p-3 text-left">Categoria</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-left">Vencimento</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {contas.sort((a, b) => a.data_vencimento - b.data_vencimento).map(c => (
                  <tr key={c.id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="p-3">{c.nome_conta}</td>
                    <td className="p-3">{c.categoria.replace('_', ' ')}</td>
                    <td className="p-3 text-right">R$ {c.valor_esperado.toFixed(2)}</td>
                    <td className="p-3">{c.data_vencimento}º dia</td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-xs ${c.status === 'pago' ? 'bg-green-600' : c.status === 'atrasado' ? 'bg-red-600' : 'bg-yellow-600'}`}>{c.status}</span></td>
                    <td className="p-3 text-center">
                      {c.status !== 'pago' && <button onClick={() => atualizarStatusConta(c.id, 'pago')} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">Pago</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
