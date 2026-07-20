'use client';

import React from 'react';
import type { ModelLog } from '@/lib/website-builder-types';
import { Cpu, DollarSign, Clock, Zap } from 'lucide-react';

interface Props {
  logs: ModelLog[];
}

export default function ModelLogPanel({ logs }: Props) {
  const totalTokens = logs.reduce((acc, l) => acc + l.promptTokens + l.completionTokens, 0);
  const totalCost = logs.reduce((acc, l) => acc + l.estimatedCost, 0).toFixed(6);
  const avgLatency = Math.round(logs.reduce((acc, l) => acc + l.latencyMs, 0) / (logs.length || 1));

  return (
    <div className="p-5 rounded-2xl border bg-zinc-900 border-zinc-800 space-y-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="text-blue-400" size={18} />
          <h3 className="font-bold text-sm text-white">OpenRouter Multi-Model Routing Telemetry</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <DollarSign size={12} /> Total Cost: ${totalCost}
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Zap size={12} /> Tokens: {totalTokens}
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <Clock size={12} /> Avg Latency: {avgLatency}ms
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider">
              <th className="py-2 px-3">Task Type</th>
              <th className="py-2 px-3">Selected Model</th>
              <th className="py-2 px-3">Vendor</th>
              <th className="py-2 px-3">Latency</th>
              <th className="py-2 px-3">Tokens</th>
              <th className="py-2 px-3 text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-zinc-800/30">
                <td className="py-2.5 px-3 font-semibold text-blue-400">{log.taskType}</td>
                <td className="py-2.5 px-3 text-white">{log.selectedModel}</td>
                <td className="py-2.5 px-3 text-zinc-400">{log.vendor}</td>
                <td className="py-2.5 px-3 text-amber-400">{log.latencyMs}ms</td>
                <td className="py-2.5 px-3 text-zinc-400">
                  {log.promptTokens} in / {log.completionTokens} out
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                  ${log.estimatedCost.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
