using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Options;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace SubscriptionManager.Auth.Infrastructure.Services;

public class ProfanityFilter : IProfanityFilter
{
    private static readonly Regex WordRegex = new(@"\p{L}+", RegexOptions.Compiled);
    private readonly HashSet<string> _forbiddenWords;

    public ProfanityFilter(IOptions<ChatModerationOptions> options)
    {
        _forbiddenWords = options.Value.ForbiddenWords
            .Where(word => !string.IsNullOrWhiteSpace(word))
            .Select(NormalizeWord)
            .Where(word => !string.IsNullOrWhiteSpace(word))
            .ToHashSet(StringComparer.Ordinal);
    }

    public bool ContainsProfanity(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || _forbiddenWords.Count == 0)
        {
            return false;
        }

        return WordRegex.Matches(text).Any(match => IsForbiddenWord(match.Value));
    }

    public string ModerateText(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || _forbiddenWords.Count == 0)
        {
            return text;
        }

        return WordRegex.Replace(
            text,
            match => IsForbiddenWord(match.Value) ? "***" : match.Value);
    }

    private static string NormalizeWord(string value)
    {
        return NormalizeText(value).Trim();
    }

    private static string NormalizeText(string value)
    {
        var chars = value
            .ToLowerInvariant()
            .Select(ch => ch == 'ё' ? 'е' : ch)
            .Select(ch => char.IsLetter(ch) ? ch : ' ')
            .ToArray();

        return new string(chars);
    }

    private bool IsForbiddenWord(string word)
    {
        var normalizedWord = NormalizeWord(word);
        if (string.IsNullOrWhiteSpace(normalizedWord))
        {
            return false;
        }

        return _forbiddenWords.Any(forbidden => normalizedWord.StartsWith(forbidden, StringComparison.Ordinal));
    }
}
