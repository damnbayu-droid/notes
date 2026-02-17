import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CameraViewProps {
    onCapture: (imageSrc: string) => void;
}

export function CameraView({ onCapture }: CameraViewProps) {
    const webcamRef = useRef<Webcam>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            onCapture(imageSrc);
        }
    }, [webcamRef, onCapture]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden flex flex-col justify-end">
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                    facingMode,
                    aspectRatio: 1.333333, // 4:3 aspect ratio to avoid wide-angle/fisheye
                }}
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleCamera}>
                    <RefreshCw className="w-6 h-6" />
                </Button>

                <Button
                    onClick={capture}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 border-4 border-gray-300 p-0"
                >
                    <div className="w-14 h-14 rounded-full border-2 border-black" />
                </Button>

                <div className="w-10" /> {/* Spacer for centering */}
            </div>
        </div>
    );
}
