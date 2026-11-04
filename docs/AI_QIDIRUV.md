# AI qidiruv (lokal Gemma 4, vLLM)

Qidiruv sahifasi (`/search?q=…`) uchta manbadan natija beradi: **so'z bo'yicha** (xizmatlar katalogi, savollar, korxonalar, maqolalar), **ma'lumot bo'yicha** (ko'rsatkichlar: nom, birlik, qiymat) va **AI tavsiyasi** (Gemma xizmatlarni mazmun bo'yicha tanlaydi).

## Qanday ishlaydi
1. Brauzer `POST /api/common/ai-search/` ga `{q, catalog}` yuboradi (katalog: raqam, nom, qisqa tavsif; ochiq ma'lumot).
2. Django (`apps/common/llm.py`) vLLM'ga `…/v1/chat/completions` so'rovi yuboradi. **Kalit faqat serverda**, brauzerga chiqmaydi.
3. Model faqat katalogdagi raqamlarni qaytara oladi; javobdagi har bir raqam tekshiriladi. Foydalanuvchi matnidagi buyruqlarga bo'ysunmaydi.
4. LLM sozlanmagan, o'chiq yoki xato bersa javob `enabled:false`: AI bloki chiqmaydi, oddiy qidiruv ishlayveradi.
5. Tezlik cheklovi: mehmonga 10/daqiqa, kirganga 30/daqiqa.

## Server sozlamasi (`backend/.env`)
```
LLM_BASE_URL=http://127.0.0.1:8002/v1
LLM_API_KEY=<~/.vllm_api_key ichidagi kalit>
LLM_MODEL=google/gemma-4-26B-A4B-it
LLM_TIMEOUT=25
```
Backend docker ichida bo'lsa `127.0.0.1` konteynerning o'ziga qaraydi. Unda `LLM_BASE_URL=http://host.docker.internal:8002/v1` (compose'da `extra_hosts: ["host.docker.internal:host-gateway"]`) yoki host tarmog'ining IP manzilini ishlating. vLLM faqat `127.0.0.1` da tinglasa, konteynerdan ko'rinmaydi: uni `--host 0.0.0.0` bilan ishga tushiring va portni tashqaridan yopib qo'ying.

Tekshirish:
```
KEY=$(cat ~/.vllm_api_key)
curl -s http://127.0.0.1:8002/v1/models -H "Authorization: Bearer $KEY"
```

## Rol bo'yicha kirish
Qidiruvda tarif/kirish talab qiladigan xizmat ostida mehmonga "Kirish / ro'yxatdan o'tish" havolasi chiqadi: `/login?role=legal|individual&next=<xizmat>`. Rol xizmat auditoriyasidan olinadi (korxona, fuqaro; ikkalasi bo'lsa tanlash ekrani). Kirgach foydalanuvchi xizmatga qaytadi.
