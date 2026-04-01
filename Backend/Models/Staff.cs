using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.db.Models
{
    [Table("staff")]
    public class Staff
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = null!;

        public int Age { get; set; }

        [MaxLength(128)]
        public string Description { get; set; } = null!;
    }
}