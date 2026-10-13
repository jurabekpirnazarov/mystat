import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getRequest } from "../api/request";
import { questions } from "../api/apiUrls";

interface FaqsType {
  question: string,
  answer: string
}

interface ResultsType {
  answer_cry: string,
  answer_ru: string,
  answer_uz: string,
  id: number,
  question_cry: string,
  question_ru: string,
  question_uz: string
}

const FAQ = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FaqsType[]>([])
  useEffect(() => {
    getRequest(questions)
      .then((res) => {
        const data = (res as { results: ResultsType[] })?.results
        const sortData = data?.map(item => ({
          question: item.question_uz,
          answer: item.answer_uz
        }))
        setFaqs(sortData)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Tez-tez So'raladigan Savollar
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {faq.question}
                </span>
                {openFaq === index ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6">
                  <div
                    className="text-gray-600 dark:text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
    </>
  );
};

export default FAQ;
