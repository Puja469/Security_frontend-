import React, { useEffect, useState } from 'react';
import {
    FaCheck,
    FaClock,
    FaExclamationTriangle,
    FaEye,
    FaFlag,
    FaInfoCircle,
    FaShieldAlt,
    FaTimes
} from 'react-icons/fa';
import { ContentSecurity } from '../utils/dataProtection';

const ContentModeration = ({ content, onModerationComplete, type = 'product' }) => {
    const [moderationResult, setModerationResult] = useState(null);
    const [isModerating, setIsModerating] = useState(false);
    const [flaggedIssues, setFlaggedIssues] = useState([]);
    const [moderationScore, setModerationScore] = useState(0);

    useEffect(() => {
        if (content) {
            performModeration();
        }
    }, [content]);

    const performModeration = async () => {
        setIsModerating(true);

        try {
            const issues = [];
            let score = 100;

            // Check for profanity
            if (content.title || content.description) {
                const text = `${content.title || ''} ${content.description || ''}`;
                const profanityCheck = ContentSecurity.profanityFilter.check(text);

                if (profanityCheck.hasProfanity) {
                    issues.push({
                        type: 'profanity',
                        severity: 'high',
                        message: `Found inappropriate language: ${profanityCheck.foundWords.join(', ')}`,
                        suggestion: 'Please remove inappropriate language from your content.'
                    });
                    score -= 30;
                }
            }

            // Check for spam
            if (content.title || content.description) {
                const text = `${content.title || ''} ${content.description || ''}`;
                const spamScore = ContentSecurity.spamDetection.score(text);

                if (ContentSecurity.spamDetection.isSpam(text)) {
                    issues.push({
                        type: 'spam',
                        severity: 'medium',
                        message: `Content appears to be spam (score: ${(spamScore * 100).toFixed(1)}%)`,
                        suggestion: 'Please provide more natural, descriptive content.'
                    });
                    score -= 25;
                }
            }

            // Validate price
            if (content.price !== undefined) {
                if (content.price < 0) {
                    issues.push({
                        type: 'price',
                        severity: 'high',
                        message: 'Price cannot be negative',
                        suggestion: 'Please enter a valid positive price.'
                    });
                    score -= 20;
                } else if (content.price > 999999.99) {
                    issues.push({
                        type: 'price',
                        severity: 'medium',
                        message: 'Price seems unusually high',
                        suggestion: 'Please verify the price is correct.'
                    });
                    score -= 10;
                }
            }

            // Validate category
            if (content.category && content.category.length < 2) {
                issues.push({
                    type: 'category',
                    severity: 'low',
                    message: 'Category name is too short',
                    suggestion: 'Please provide a more descriptive category name.'
                });
                score -= 5;
            }

            // Check for duplicate content (basic check)
            if (content.title && content.title.length < 5) {
                issues.push({
                    type: 'title',
                    severity: 'medium',
                    message: 'Title is too short',
                    suggestion: 'Please provide a more descriptive title (at least 5 characters).'
                });
                score -= 15;
            }

            // Validate image if present
            if (content.image && content.image instanceof File) {
                const imageValidation = await ContentSecurity.imageValidation.checkDimensions(content.image);

                if (!imageValidation.isValid) {
                    issues.push({
                        type: 'image',
                        severity: 'medium',
                        message: `Image dimensions are invalid (${imageValidation.width}x${imageValidation.height})`,
                        suggestion: 'Please use an image between 100x100 and 4000x4000 pixels.'
                    });
                    score -= 15;
                }

                const aspectRatioValid = ContentSecurity.imageValidation.checkAspectRatio(
                    imageValidation.width,
                    imageValidation.height
                );

                if (!aspectRatioValid) {
                    issues.push({
                        type: 'image',
                        severity: 'low',
                        message: 'Image aspect ratio is unusual',
                        suggestion: 'Please use an image with a more standard aspect ratio.'
                    });
                    score -= 5;
                }
            }

            // Check content length
            if (content.description) {
                if (content.description.length < 10) {
                    issues.push({
                        type: 'description',
                        severity: 'medium',
                        message: 'Description is too short',
                        suggestion: 'Please provide a more detailed description (at least 10 characters).'
                    });
                    score -= 10;
                } else if (content.description.length > 1000) {
                    issues.push({
                        type: 'description',
                        severity: 'low',
                        message: 'Description is very long',
                        suggestion: 'Consider shortening the description for better readability.'
                    });
                    score -= 5;
                }
            }

            // Check for suspicious patterns
            const suspiciousPatterns = [
                { pattern: /(buy|sell|cheap|discount|offer|deal|limited|urgent|act now|click here)/gi, type: 'marketing' },
                { pattern: /(\d{10,})/g, type: 'numbers' },
                { pattern: /([A-Z]{5,})/g, type: 'caps' },
                { pattern: /(.)\1{4,}/g, type: 'repetition' }
            ];

            const text = `${content.title || ''} ${content.description || ''}`;
            suspiciousPatterns.forEach(({ pattern, type }) => {
                const matches = text.match(pattern);
                if (matches && matches.length > 2) {
                    issues.push({
                        type: 'suspicious_pattern',
                        severity: 'medium',
                        message: `Found suspicious ${type} patterns`,
                        suggestion: 'Please review your content for unusual patterns.'
                    });
                    score -= 10;
                }
            });

            const result = {
                isApproved: score >= 70,
                score: Math.max(0, score),
                issues,
                timestamp: new Date().toISOString(),
                type
            };

            setModerationResult(result);
            setFlaggedIssues(issues);
            setModerationScore(score);

            if (onModerationComplete) {
                onModerationComplete(result);
            }

        } catch (error) {
            console.error('Moderation error:', error);
            setModerationResult({
                isApproved: false,
                score: 0,
                issues: [{
                    type: 'error',
                    severity: 'high',
                    message: 'Error during moderation',
                    suggestion: 'Please try again or contact support.'
                }],
                timestamp: new Date().toISOString(),
                type
            });
        } finally {
            setIsModerating(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreMessage = (score) => {
        if (score >= 80) return 'Content looks good!';
        if (score >= 60) return 'Content needs some improvements';
        return 'Content requires significant changes';
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high': return <FaExclamationTriangle className="text-red-500" />;
            case 'medium': return <FaFlag className="text-yellow-500" />;
            case 'low': return <FaInfoCircle className="text-blue-500" />;
            default: return <FaInfoCircle className="text-gray-500" />;
        }
    };

    if (!content) {
        return (
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-center text-gray-500">
                    <FaShieldAlt className="text-4xl mx-auto mb-4" />
                    <p>No content to moderate</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Moderation Header */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center">
                            <FaShieldAlt className="text-2xl text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Content Moderation</h3>
                            <p className="text-gray-600">Checking content for quality and safety</p>
                        </div>
                    </div>

                    {moderationResult && (
                        <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(moderationScore)}`}>
                                {moderationScore}
                            </div>
                            <div className="text-sm text-gray-600">Moderation Score</div>
                            <div className={`text-xs ${getScoreColor(moderationScore)}`}>
                                {getScoreMessage(moderationScore)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isModerating && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-200/30">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Moderating Content</h3>
                        <p className="text-gray-600">Checking for inappropriate content, spam, and quality issues...</p>
                    </div>
                </div>
            )}

            {/* Moderation Results */}
            {moderationResult && !isModerating && (
                <div className="space-y-6">
                    {/* Overall Status */}
                    <div className={`p-6 rounded-2xl border-2 ${moderationResult.isApproved
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center space-x-4">
                            {moderationResult.isApproved ? (
                                <FaCheck className="text-3xl text-green-500" />
                            ) : (
                                <FaTimes className="text-3xl text-red-500" />
                            )}
                            <div>
                                <h3 className={`text-xl font-bold ${moderationResult.isApproved ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {moderationResult.isApproved ? 'Content Approved' : 'Content Needs Review'}
                                </h3>
                                <p className={`text-sm ${moderationResult.isApproved ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {moderationResult.isApproved
                                        ? 'Your content meets our quality standards and can be published.'
                                        : 'Please address the issues below before publishing.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Flagged Issues */}
                    {flaggedIssues.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/30">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                                <FaExclamationTriangle className="text-orange-500" />
                                <span>Issues Found ({flaggedIssues.length})</span>
                            </h3>

                            <div className="space-y-4">
                                {flaggedIssues.map((issue, index) => (
                                    <div key={index} className={`p-4 rounded-2xl border ${getSeverityColor(issue.severity)}`}>
                                        <div className="flex items-start space-x-3">
                                            {getSeverityIcon(issue.severity)}
                                            <div className="flex-1">
                                                <h4 className="font-semibold capitalize">{issue.type.replace('_', ' ')}</h4>
                                                <p className="text-sm mt-1">{issue.message}</p>
                                                <p className="text-sm mt-2 font-medium">Suggestion: {issue.suggestion}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Summary */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/30">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                            <FaEye className="text-blue-500" />
                            <span>Content Summary</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.title && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Title</label>
                                    <p className="text-gray-800 mt-1">{content.title}</p>
                                </div>
                            )}

                            {content.category && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Category</label>
                                    <p className="text-gray-800 mt-1">{content.category}</p>
                                </div>
                            )}

                            {content.price !== undefined && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Price</label>
                                    <p className="text-gray-800 mt-1">${content.price}</p>
                                </div>
                            )}

                            {content.description && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-600">Description</label>
                                    <p className="text-gray-800 mt-1">{content.description}</p>
                                </div>
                            )}

                            {content.image && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-600">Image</label>
                                    <div className="mt-2">
                                        <img
                                            src={content.image instanceof File ? URL.createObjectURL(content.image) : content.image}
                                            alt="Content preview"
                                            className="w-32 h-32 object-cover rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Moderation Details */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/30">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                            <FaClock className="text-purple-500" />
                            <span>Moderation Details</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <label className="font-medium text-gray-600">Content Type</label>
                                <p className="text-gray-800 mt-1 capitalize">{type}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-600">Moderation Score</label>
                                <p className={`font-bold mt-1 ${getScoreColor(moderationScore)}`}>
                                    {moderationScore}/100
                                </p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-600">Checked At</label>
                                <p className="text-gray-800 mt-1">
                                    {new Date(moderationResult.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentModeration; 