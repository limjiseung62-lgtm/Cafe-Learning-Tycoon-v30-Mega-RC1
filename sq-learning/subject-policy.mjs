export const TYPE_PRACTICE_SUBJECTS=Object.freeze(['korean-literacy','social-studies']);
export const typePractice=subject=>TYPE_PRACTICE_SUBJECTS.includes(subject);
export const TYPE_POLICY=Object.freeze({version:'same-type-diverse/1',difficultyFilter:false,recentDistinctWindow:2,baseOrder:'least-used-family-then-least-recent-question',retry:'different-question-same-family-within-selected-objectives',crossSubject:false,crossGrade:false,crossUnit:false,newQuestions:false,mathEquivalentClaim:false});
export function sameType(a,b){return a.questionId!==b.questionId&&a.subjectId===b.subjectId&&a.grade===b.grade&&a.semester===b.semester&&a.unitId===b.unitId&&a.familyId===b.familyId&&a.questionType===b.questionType;}
