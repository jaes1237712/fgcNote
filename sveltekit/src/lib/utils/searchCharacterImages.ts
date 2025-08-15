import type { CharacterMoveImageDto } from '$lib/client/types.gen';

interface searchInput {
	input: string;
	images: CharacterMoveImageDto[];
}

/**
 * use whether include input to do the filter function.
 */
export function searchCharacterImages(searchInput: searchInput): CharacterMoveImageDto[] {
	const input = searchInput.input.trim().toLowerCase();
	if (!input) return searchInput.images;
	return searchInput.images.filter((img) => img.fileName.toLowerCase().includes(input));
}
