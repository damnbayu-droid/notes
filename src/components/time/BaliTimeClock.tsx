import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Clock } from 'lucide-react';

const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Makassar'; // Fallback only
interface BaliTimeClockProps {
    headless?: boolean;
}

export function BaliTimeClock({ headless = false }: BaliTimeClockProps) {
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
        DEVICE_TIMEZONE,
        'HH:mm:ss'
    );

    const formattedDate = formatInTimeZone(
        currentTime,
        DEVICE_TIMEZONE,
        'EEEE, dd MMMM yyyy'
    );

    const content = (
        <>
            <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${headless ? 'text-inherit' : 'text-violet-600 dark:text-violet-400'}`} />
            <div className="flex flex-col items-center">
                <div className={`${headless ? 'text-[10px] sm:text-sm' : 'text-2xl'} font-bold tabular-nums leading-none ${headless ? 'text-inherit' : 'text-violet-900 dark:text-violet-100'}`}>
                    {formattedTime}
                </div>
                {headless ? (
                    <div className="hidden sm:block text-[8px] leading-tight text-inherit opacity-80">
                        {formattedDate} ({DEVICE_TIMEZONE.split('/')[1]?.replace('_', ' ') || 'Local'})
                    </div>
                ) : (
                    <div className="text-xs leading-tight text-violet-600 dark:text-violet-400">
                        {formattedDate} ({DEVICE_TIMEZONE.split('/')[1]?.replace('_', ' ') || 'Local'})
                    </div>
                )}
            </div>
        </>
    );

    if (headless) {
        return content;
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg border border-violet-200 dark:border-violet-800 shadow-sm">
            {content}
        </div>
    );
}
