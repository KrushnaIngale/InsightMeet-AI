"""
RAG chat over a transcript's vector store.

AI logic UNCHANGED: same system prompt, same LCEL chain shape
(retriever -> format_docs -> prompt -> llm -> StrOutputParser),
same Mistral model/temperature.

Only change: build_rag_chain / load_rag_chain now take a document_id
so chat can be re-loaded for any previously processed document without
keeping every chain in memory (matches the "never store everything in
memory" requirement).
"""

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

from app.config import settings
from app.core.vector_store import build_vector_store, load_vector_store, get_retriever

SYSTEM_PROMPT = """You are an expert meeting assistant. Answer the user's question 
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.

Context from meeting transcript:
{context}"""


def get_llm():
    return ChatMistralAI(
        model=settings.MISTRAL_MODEL,
        mistral_api_key=settings.MISTRAL_API_KEY,
        temperature=0.2,
    )


def format_docs(docs):
    return "\n\n".join([doc.page_content for doc in docs])


def _assemble_chain(retriever):
    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{question}"),
    ])

    # full LCEL RAG pipeline
    rag_chain = (
        {"context": retriever | RunnableLambda(format_docs),
         "question": RunnablePassthrough()}
        | prompt | llm | StrOutputParser()
    )

    return rag_chain


def build_rag_chain(transcript: str, document_id: str):
    """Build a fresh vector store + RAG chain right after processing a new document."""
    vector_store = build_vector_store(transcript, document_id)
    retriever = get_retriever(vector_store, k=4)
    return _assemble_chain(retriever)


def load_rag_chain(document_id: str):
    """Reload a RAG chain for chatting with a previously processed document."""
    vector_store = load_vector_store(document_id)
    retriever = get_retriever(vector_store, k=4)
    return _assemble_chain(retriever)


def ask_question(rag_chain, question: str) -> str:
    print(f"Question : {question}")
    answer = rag_chain.invoke(question)
    print(f"answer :{answer}")
    return answer
