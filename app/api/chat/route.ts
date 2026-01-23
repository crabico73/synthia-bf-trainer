import { GoogleGenerativeAI } from '@google/generative-ai';
import {NextResponse} from "next/server";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(message);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
