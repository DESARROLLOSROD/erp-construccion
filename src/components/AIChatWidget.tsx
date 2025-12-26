'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, X, Send } from 'lucide-react'

export function AIChatWidget() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 z-50"
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="h-6 w-6 text-white" />
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[350px] h-[500px] shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg p-4 flex flex-row justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> ERP Copilot
                </CardTitle>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-10">
                        <p>👋 Hola!</p>
                        <p>Puedo responder preguntas sobre tus finanzas (este mes) e inventario.</p>
                        <p className="mt-2 text-xs italic">Asegúrate de configurar tu API Key.</p>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border text-slate-800 shadow-sm'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border text-slate-500 rounded-lg p-3 text-sm shadow-sm">
                            <span className="animate-pulse">Pensando...</span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-3 bg-white border-t">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Pregunta algo..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
