import React from 'react';
import { Search, Sprout, Bug } from 'lucide-react';

export default function SearchCard({ crop, setCrop, pest, setPest, onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '800px', margin: '-2rem auto 2rem' }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex" style={{ flexDirection: 'row', gap: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Crop Input */}
          <div className="input-group" style={{ flex: '1 1 300px' }}>
            <label htmlFor="crop" className="input-label flex items-center gap-2 mb-2">
              <Sprout size={18} color="var(--color-brand-primary)" />
              輸入作物名稱
            </label>
            <input
              id="crop"
              type="text"
              className="input-field"
              placeholder="例如：木瓜、柑橘、玫瑰"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              required
            />
          </div>

          {/* Pest Input */}
          <div className="input-group" style={{ flex: '1 1 300px' }}>
            <label htmlFor="pest" className="input-label flex items-center gap-2 mb-2">
              <Bug size={18} color="var(--color-brand-primary)" />
              輸入防治對象 (病蟲害)
            </label>
            <input
              id="pest"
              type="text"
              className="input-field"
              placeholder="例如：白粉病、葉蟎"
              value={pest}
              onChange={(e) => setPest(e.target.value)}
              required
            />
          </div>

        </div>

        <div className="flex justify-center mt-4 mb-2">
          <button type="submit" className="btn-primary flex items-center">
            <Search size={20} />
            尋找適用農藥
          </button>
        </div>
      </form>
    </div>
  );
}
