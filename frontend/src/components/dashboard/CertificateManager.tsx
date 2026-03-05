"use client";

import { useState } from "react";
import { Award, Download, Eye } from "lucide-react";
import { generateBeltCertificate } from "@/lib/beltCertificateGenerator";

const SAMPLE_BELTS = ["Orange", "Blue", "Yellow", "Green", "Brown", "Black 1st Dan"];

export default function CertificateManager() {
    const [previewBelt, setPreviewBelt] = useState("Orange");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const sampleData = {
        studentName: "Rahul Kumar Singh",
        instructorName: "Vasant Kumar Singh",
        beltRank: previewBelt,
        dateOfApproval: new Date().toISOString(),
    };

    const handlePreview = async () => {
        const pdf = await generateBeltCertificate(sampleData);
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
    };

    const handleDownloadSample = async () => {
        const pdf = await generateBeltCertificate(sampleData);
        pdf.save(`Sample_${previewBelt.replace(/\s+/g, "_")}_Belt_Certificate.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30">
                        <Award className="w-5 h-5 text-white" />
                    </div>
                    Certificates
                </h1>
                <p className="text-sm text-gray-500 mt-1.5 ml-[52px]">
                    Preview and manage belt promotion certificates
                </p>
            </div>

            {/* Sample Certificate Preview */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-white">Sample Certificate Preview</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            This is how the belt promotion certificate will look for students
                        </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full uppercase tracking-wider">
                        Preview
                    </span>
                </div>

                <div className="p-5 space-y-5">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                                Belt Rank
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {SAMPLE_BELTS.map((belt) => {
                                    const isActive = previewBelt === belt;
                                    const colorMap: Record<string, string> = {
                                        Orange: "bg-orange-500",
                                        Blue: "bg-blue-500",
                                        Yellow: "bg-yellow-400",
                                        Green: "bg-green-500",
                                        Brown: "bg-amber-800",
                                        "Black 1st Dan": "bg-black border border-white/30",
                                    };
                                    return (
                                        <button
                                            key={belt}
                                            onClick={() => { setPreviewBelt(belt); setPreviewUrl(null); }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                                isActive
                                                    ? "bg-white/10 text-white ring-1 ring-amber-500/50"
                                                    : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-300"
                                            }`}
                                        >
                                            <span className={`w-3 h-3 rounded-full ${colorMap[belt] || "bg-gray-500"}`} />
                                            {belt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                onClick={handlePreview}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                            </button>
                            <button
                                onClick={handleDownloadSample}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download Sample
                            </button>
                        </div>
                    </div>

                    {/* Certificate Preview (inline) */}
                    {previewUrl ? (
                        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-gray-900">
                            <iframe
                                src={previewUrl}
                                className="w-full h-[500px] sm:h-[600px]"
                                title="Certificate Preview"
                            />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] flex flex-col items-center justify-center py-20 gap-4">
                            {/* Static mockup of the certificate */}
                            <div className="w-full max-w-2xl mx-auto aspect-[297/210] bg-white rounded-lg shadow-2xl shadow-black/40 p-4 relative overflow-hidden">
                                {/* Outer navy border */}
                                <div className="absolute inset-1.5 border-[3px] border-[#192855] rounded" />
                                {/* Red border */}
                                <div className="absolute inset-[10px] border-[1.5px] border-red-600 rounded" />
                                {/* Gold border */}
                                <div className="absolute inset-3 border border-amber-500/40 rounded" />

                                <div className="relative flex flex-col items-center justify-between h-full py-3 px-6">
                                    {/* Top section */}
                                    <div className="text-center space-y-0.5 mt-1">
                                        <p className="text-[10px] sm:text-sm font-bold text-[#192855] tracking-wider">
                                            KYOKUSHIN KARATE FEDERATION OF INDIA
                                        </p>
                                        <p className="text-[6px] sm:text-[8px] text-red-600 font-medium">
                                            Aff. to - International Karate Organisation, World Kyokushinkai-Kan (Japan)
                                        </p>
                                        <p className="text-[5px] sm:text-[6px] text-gray-400">
                                            ISO 9001 Certified | ISO 45001 Certified | FIT India | NITI Aayog Recognised
                                        </p>
                                        <div className="w-32 h-[1px] bg-amber-500/60 mx-auto mt-1" />
                                        <h3 className="text-lg sm:text-2xl font-black text-[#192855] tracking-wide !mt-2">
                                            CERTIFICATE
                                        </h3>
                                        <p className="text-[9px] sm:text-xs text-[#324178] font-medium">
                                            OF BELT PROMOTION
                                        </p>
                                    </div>

                                    {/* Middle section */}
                                    <div className="text-center space-y-1 flex-1 flex flex-col items-center justify-center -mt-1">
                                        <p className="text-[8px] sm:text-[10px] text-[#192855] italic">
                                            This is to certify that
                                        </p>
                                        <p className="text-sm sm:text-xl font-black text-[#192855] tracking-wider border-b border-[#192855]/30 pb-1 px-4">
                                            RAHUL KUMAR SINGH
                                        </p>
                                        <p className="text-[6px] sm:text-[8px] text-[#192855] italic leading-relaxed max-w-sm">
                                            has appeared for Grading Test and has successfully completed the basic methods of Kyokushin Karate - Kihons, Ido-kihon, Kata, Kumite and passed the test.
                                        </p>
                                        <p className="text-[8px] sm:text-[10px] text-[#324178] italic">
                                            and has been promoted to the rank of
                                        </p>
                                        <p className={`text-sm sm:text-lg font-black tracking-widest ${
                                            previewBelt === "Orange" ? "text-orange-500" :
                                            previewBelt === "Blue" ? "text-blue-500" :
                                            previewBelt === "Yellow" ? "text-yellow-500" :
                                            previewBelt === "Green" ? "text-green-600" :
                                            previewBelt === "Brown" ? "text-amber-800" :
                                            "text-gray-900"
                                        }`}>
                                            {previewBelt.toUpperCase()}
                                        </p>
                                        <div className={`w-16 h-1 rounded-full ${
                                            previewBelt === "Orange" ? "bg-orange-500" :
                                            previewBelt === "Blue" ? "bg-blue-500" :
                                            previewBelt === "Yellow" ? "bg-yellow-400" :
                                            previewBelt === "Green" ? "bg-green-500" :
                                            previewBelt === "Brown" ? "bg-amber-800" :
                                            "bg-gray-900"
                                        }`} />
                                        <p className="text-[5px] sm:text-[7px] text-[#324178] italic max-w-xs">
                                            Hereafter he/she promises to continue to improve himself/herself Physically, mentally, and morally.
                                        </p>
                                    </div>

                                    {/* Bottom section — signatures */}
                                    <div className="flex justify-between w-full px-2 sm:px-6 mb-1">
                                        <div className="text-center">
                                            <p className="text-[9px] sm:text-xs font-bold text-[#192855]">Vasant Kumar Singh</p>
                                            <div className="w-20 sm:w-24 h-[1px] bg-[#192855] mt-1 mx-auto" />
                                            <p className="text-[6px] sm:text-[8px] text-red-600 mt-1 font-medium">INSTRUCTOR NAME / SIGNATURE</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[7px] sm:text-[9px] text-[#192855] italic">Country Director</p>
                                            <p className="text-[9px] sm:text-xs font-bold text-[#192855]">Shihan Vasant Kumar Singh</p>
                                            <div className="w-20 sm:w-24 h-[1px] bg-[#192855] mt-1 mx-auto" />
                                            <p className="text-[6px] sm:text-[8px] text-red-600 mt-1 font-medium">5th Dan Black Belt (Japan)</p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="text-center">
                                        <div className="w-40 h-[1px] bg-amber-500/40 mx-auto mb-1" />
                                        <p className="text-[5px] text-gray-400">Kyokushin Karate Federation of India | www.kyokushinkarate.in</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                Click <span className="text-blue-400 font-semibold">Preview</span> to see the full PDF or <span className="text-amber-400 font-semibold">Download Sample</span> to save it
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Coming Soon Section */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-sm font-bold text-white mb-4">Coming Soon</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { title: "Tournament Certificates", desc: "Auto-generate certificates for tournament winners" },
                        { title: "Seminar Certificates", desc: "Attendance certificates for seminar participants" },
                        { title: "Custom Templates", desc: "Upload and customize certificate designs" },
                        { title: "Bulk Generation", desc: "Generate certificates for all passed students at once" },
                        { title: "Email Delivery", desc: "Auto-email certificates to students after promotion" },
                        { title: "QR Verification", desc: "QR codes on certificates for authenticity verification" },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl p-4 opacity-60"
                        >
                            <p className="text-xs font-bold text-gray-300">{item.title}</p>
                            <p className="text-[11px] text-gray-500 mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
