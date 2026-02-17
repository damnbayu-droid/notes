import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Clock } from 'lucide-react';

const BALI_TIMEZONE = 'Asia/Makassar'; // UTC+8 (Bali/WITA)

export function BaliTimeClock() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update time every second
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    // Auto-calibrate time every 6 hours
    useEffect(() => {
        const calibrateTime = () => {
            setCurrentTime(new Date());
        };

        // Calibrate every 6 hours (21600000 ms)
        const calibrationInterval = setInterval(calibrateTime, 6 * 60 * 60 * 1000);

        return () => clearInterval(calibrationInterval);
    }, []);

    const formattedTime = formatInTimeZone(
        currentTime,
        BALI_TIMEZONE,
        'HH:mm:ss'
    );

    const formattedDate = formatInTimeZone(
        currentTime,
        BALI_TIMEZONE,
        'EEEE, dd MMMM yyyy'
    );

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg border border-violet-200 dark:border-violet-800 shadow-sm">
            <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <div className="flex flex-col">
                <div className="text-2xl font-bold text-violet-900 dark:text-violet-100 tabular-nums">
                    {formattedTime}
                </div>
                <div className="text-xs text-violet-600 dark:text-violet-400">
                    {formattedDate} (Bali Time)
                </div>
            </div>
        </div>
    );
}
