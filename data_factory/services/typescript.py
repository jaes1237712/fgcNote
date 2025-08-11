'''
    Convert our file to the typescript file that web app need.
'''

def build_CHARACTER_TO_ICON_SRC(icon_directory: Path):
    '''
        The logic is iterate all the file in the directory.
        If the file name contain the character name and end with .webp, 
        then append {character}: {the file path}

        export const CHARACTER_TO_ICON_SRC = {
            {character1}: {character1 Icon SRC}
        }
    '''

def build_CHARACTER_TO_ICON_SRC(icon_directory: Path):
    '''
        export const CHARACTER_TO_ICON_SRC = {
            {character1}: {character1 Icon SRC}
        }
    '''