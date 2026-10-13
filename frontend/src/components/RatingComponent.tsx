import React, { useState } from 'react';
import { Star, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { createRating } from '../api/rating';

interface RatingComponentProps {
  serviceId: number;
  serviceName?: string;
  onRatingSubmitted?: () => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({ 
  serviceId, 
  serviceName = "Xizmat",
  onRatingSubmitted 
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);

  const handleStarClick = (value: number) => {
    setRating(value);
    setShowCommentForm(true);
    setError(null);
  };

  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Iltimos, baho bering');
      return;
    }

    if (comment.trim().length < 5) {
      setError('Iltimos, kamida 5 ta belgi kiriting');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createRating({
        service: serviceId,
        value: rating,
        comment: comment.trim()
      });

      setIsSubmitted(true);
      onRatingSubmitted?.();
    } catch (err) {
      console.error('Rating submission error:', err);
      setError('Baholashda xato yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (value: number) => {
    switch (value) {
      case 1: return 'Juda yomon';
      case 2: return 'Yomon';
      case 3: return 'O\'rtacha';
      case 4: return 'Yaxshi';
      case 5: return 'A\'lo';
      default: return 'Baho bering';
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center text-green-700">
          <CheckCircle className="w-8 h-8 mr-3" />
          <div>
            <h3 className="font-semibold text-lg">Rahmat!</h3>
            <p className="text-sm">Sizning bahongiz muvaffaqiyatli yuborildi</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          "{serviceName}" xizmatini baholang
        </h3>
        <p className="text-sm text-gray-600">
          Sizning fikringiz biz uchun muhim
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              onMouseLeave={handleStarLeave}
              className="transition-all duration-200 hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Rating Text */}
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-gray-700">
          {getRatingText(hoveredRating || rating)}
        </p>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="space-y-4">
          <div className="relative">
            <MessageCircle className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Fikringizni yozing..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {comment.length}/500
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting || rating === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Yuborish</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default RatingComponent;