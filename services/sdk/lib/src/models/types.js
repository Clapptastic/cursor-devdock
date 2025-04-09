"use strict";
/**
 * Customer Survey SDK Types
 * Defines the interfaces and types used throughout the SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyStatus = exports.QuestionType = void 0;
/**
 * Question type enum
 */
var QuestionType;
(function (QuestionType) {
    QuestionType["TEXT"] = "text";
    QuestionType["SINGLE_CHOICE"] = "single_choice";
    QuestionType["MULTIPLE_CHOICE"] = "multiple_choice";
    QuestionType["RATING"] = "rating";
    QuestionType["SCALE"] = "scale";
    QuestionType["CHECKBOX"] = "checkbox";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
/**
 * Survey status
 */
var SurveyStatus;
(function (SurveyStatus) {
    SurveyStatus["DRAFT"] = "draft";
    SurveyStatus["ACTIVE"] = "active";
    SurveyStatus["CLOSED"] = "closed";
    SurveyStatus["ARCHIVED"] = "archived";
    SurveyStatus["PUBLISHED"] = "published";
})(SurveyStatus || (exports.SurveyStatus = SurveyStatus = {}));
