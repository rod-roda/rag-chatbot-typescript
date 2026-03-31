import FileUpload from '@/components/FileUpload';
import Chat from '@/components/Chat';

export default function Home() {
    return (
        <main className="flex flex-col h-screen max-w-3xl mx-auto w-full p-4 gap-4">
            <h1 className="text-xl font-bold text-center">RAG Chatbot</h1>
            <FileUpload />
            <Chat />
        </main>
    );
}
