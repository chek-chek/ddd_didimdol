from openai import OpenAI
from dotenv import load_dotenv
from db import get_supabase_client
from constants import types_dict

load_dotenv()


def load_all_prompts(prompt_names: list[str]) -> dict[str, str]:
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("prompts")
            .select("prompt_nm", "content")
            .in_("prompt_nm", prompt_names)
            .execute()
        )
        if not result.data:
            raise ValueError("프롬프트들을 찾을 수 없습니다.")

        prompts = {item["prompt_nm"]: item["content"] for item in result.data}
        for name in prompt_names:
            if name in prompts:
                print(f"✅ 프롬프트 '{name}' 로드 완료")
            else:
                print(f"⚠️  프롬프트 '{name}' 누락됨")
        return prompts

    except Exception as e:
        print(f"❌ 프롬프트 일괄 로드 중 오류 발생: {e}")
        raise


prompt_names = [
    "chat_instruction",
    "chat_few_shots",
    "analyze_type",
    "analyze_solution",
    "analyze_instruction",
    "analyze_few_shots",
]

PROMPTS = load_all_prompts(prompt_names)

CHAT_INSTRUCTION = PROMPTS["chat_instruction"]
CHAT_FEW_SHOTS = PROMPTS["chat_few_shots"]
ANALYZE_TYPE = PROMPTS["analyze_type"]
ANALYZE_SOLUTION = PROMPTS["analyze_solution"]
ANALYZE_INSTRUCTION = PROMPTS["analyze_instruction"]
ANALYZE_FEW_SHOTS = PROMPTS["analyze_few_shots"]


def chat(message, chat_history):
    client = OpenAI()
    system_prompt = CHAT_INSTRUCTION + "\n###발화 스타일 가이드" + CHAT_FEW_SHOTS
    messages = [{"role": "system", "content": system_prompt}] + chat_history
    messages.append(
        {
            "role": "user",
            "content": message,
        }
    )
    response = client.chat.completions.create(
        model="gpt-4.1-mini", messages=messages, temperature=0.2
    )
    return response.choices[0].message.content.strip()


def analyze(chat_history):
    client = OpenAI()
    # type classification
    type_input = ANALYZE_TYPE + "\n###사용자의 대화:\n" + str(chat_history)
    type_response = client.responses.create(model="gpt-4.1-mini", input=type_input)
    type = type_response.output_text.strip()
    # solution classification
    solution_input = ANALYZE_SOLUTION + "\n###사용자의 대화:\n" + str(chat_history)
    solution_response = client.responses.create(
        model="gpt-4.1-mini", input=solution_input
    )
    solution = solution_response.output_text.strip()
    # reason generation
    reason_input = (
        ANALYZE_INSTRUCTION
        + f"\n사용자의 성격 타입: {type}\n"
        + f"사용자에게 추천할 교재: {solution}\n"
        + "###예시 답변\n"
        + ANALYZE_FEW_SHOTS
        + "\n###사용자의 대화\n"
        + str(chat_history)
    )
    reason_response = client.responses.create(model="gpt-4.1-mini", input=reason_input)
    reason = reason_response.output_text.strip()
    response = {"type": type, "solution": solution, "reason": reason}
    return response
